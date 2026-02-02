import cron from "node-cron";
import { supabase } from "../config/supabase.js";
import { sendEmailNotification } from "./emailService.js";
import { fetchAnilistAiringSchedule, fetchAnilistManga } from "./anilistService.js";
import { checkAnimeUpdate, checkMangaUpdate } from "./matchingService.js";

const processUpdates = async () => {
    console.log("--- Starting Global Update Check (Anilist) ---");

    // 1. Fetch Today's Anime from Anilist
    const todayAnime = await fetchAnilistAiringSchedule();
    console.log(`[Anilist] Fetched ${todayAnime.length} airing episodes for today.`);

    // 2. Fetch specific Manga updates based on subscriptions
    const { data: allItems, error: itemsError } = await supabase.from("items").select("*");
    if (itemsError) {
        console.error("Error fetching items:", itemsError);
        return;
    }

    const mangaUpdates = [];
    for (const item of allItems) {
        if (item.type === 'manga') {
            try {
                // Use Anilist for manga check
                const mangaData = await fetchAnilistManga(item.title);

                if (mangaData) {
                    // Reuse existing matching logic, mapping fields if necessary
                    // Anilist 'chapters' is total count, so it works with 'checkMangaUpdate'
                    const update = checkMangaUpdate(item, mangaData);

                    if (update) {
                        mangaUpdates.push({
                            title: update.title,
                            type: 'manga',
                            release_info: update.message,
                            url: update.url,
                            image_url: update.image_url,
                            mal_id: mangaData.mal_id,
                            db_item_id: item.id,
                            update_payload: {
                                last_chapter: update.type === 'new_chapter' ? update.newValue : undefined,
                                status: update.type === 'status_change' ? update.newValue : undefined,
                                last_checked_at: new Date()
                            }
                        });
                    }
                }
            } catch (e) {
                console.error(`Error checking manga ${item.title}: ${e.message}`);
            }
        } else if (item.type === 'anime') {
            // For anime, update last_checked_at if it's in today's Anilist schedule
            const match = todayAnime.find(a => a.title.toLowerCase() === item.title.toLowerCase());
            if (match) {
                await supabase.from("items").update({ last_checked_at: new Date() }).eq("id", item.id);
            }
        }
    }

    // 3. Prepare "New Releases" List
    // Anime from Anilist schedule
    const animeReleases = todayAnime.map(a => ({
        mal_id: a.mal_id || a.anilist_id, // Fallback to Anilist ID if MAL ID is missing
        title: a.title,
        type: "anime",
        release_info: `Episode ${a.episode}`,
        url: a.url,
        image_url: a.image_url
    }));

    // Manga updates
    const mangaReleasesFormatted = mangaUpdates.map(m => ({
        mal_id: m.mal_id || m.anilist_id,
        title: m.title,
        type: m.type,
        release_info: m.release_info,
        url: m.url,
        image_url: m.image_url
    }));

    const allNewReleases = [...animeReleases, ...mangaReleasesFormatted];
    console.log(`[Cache] Prepared ${allNewReleases.length} items for new_releases.`);

    // 4. Update 'new_releases' Cache
    if (allNewReleases.length > 0) {
        const { error: clearError } = await supabase.from("new_releases").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (clearError) console.error("Error clearing new_releases:", clearError);

        const { error: insertError } = await supabase.from("new_releases").insert(allNewReleases);
        if (insertError) console.error("Error populating new_releases:", insertError);
        else console.log("✅ 'new_releases' cache updated.");
    }

    // 5. Update Items Table (Manga Only mostly)
    for (const m of mangaUpdates) {
        await supabase.from("items").update(m.update_payload).eq("id", m.db_item_id);
    }

    // 6. NOTIFICATION LOGIC: Match 'new_releases' against 'subscriptions'
    // This assumes specific titles match.
    // Fetch all subscriptions with their item details
    const { data: subs, error: subErr } = await supabase
        .from("subscriptions")
        .select("user_id, item_id, items(title, type)");

    if (subErr) {
        console.error("Error fetching subscriptions:", subErr);
        return;
    }

    const notificationsToSend = [];
    const CLIENT_URL = "https://anime-finder-black.vercel.app"; // User requested specific domain

    for (const sub of subs) {
        if (!sub.items) continue;

        // Is this subscribed item in our new releases list?
        // We match by TITLE and TYPE
        const match = allNewReleases.find(r =>
            r.title.toLowerCase() === sub.items.title.toLowerCase() &&
            r.type === sub.items.type
        );

        if (match) {
            // Need to verify if we should notify (e.g. don't notify same episode twice?)
            // But 'new_releases' is fresh today. So if it's there, it's new.
            // (For ongoing anime, it's there every week. Users might get 1 notif per week, which is correct).

            notificationsToSend.push({
                user_id: sub.user_id,
                title: match.release_info,
                message: `${match.title} - ${match.release_info}`,
                link: `${CLIENT_URL}/main`,
                is_read: false
            });
        }
    }

    if (notificationsToSend.length > 0) {
        console.log(`[Notification] Generating ${notificationsToSend.length} total notifications.`);

        // Group by user for safer insertion (if one user is deleted, don't fail properly for others)
        const userMap = new Map();
        for (const n of notificationsToSend) {
            if (!userMap.has(n.user_id)) userMap.set(n.user_id, []);
            userMap.get(n.user_id).push(n);
        }

        console.log(`[Notification] Sending to ${userMap.size} unique users.`);

        for (const [userId, userNotifs] of userMap.entries()) {

            // 1. Fetch user email FIRST from public.users
            const { data: userRecord } = await supabase
                .from("users")
                .select("email")
                .eq("id", userId)
                .single();

            let targetUserId = userId; // Default to the ID in subscriptions
            let emailSent = false;

            if (userRecord && userRecord.email) {
                // 2. Resolve the ACTIVE Auth User ID for this email
                // This fixes the "Ghost User" issue where subscriptions point to an old ID
                const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

                if (!authError && authData && authData.users) {
                    const authUser = authData.users.find(u => u.email === userRecord.email);
                    if (authUser) {
                        targetUserId = authUser.id;
                        if (targetUserId !== userId) {
                            console.log(`[Fix] Remapped ID: Subscription(${userId}) -> Auth(${targetUserId}) for ${userRecord.email}`);
                        }
                    } else {
                        console.warn(`[Warning] Email ${userRecord.email} not found in Auth Users.`);
                    }
                }

                // 3. Send Email
                const html = `
                    <h1>New Updates!</h1>
                    <p>We found new content for your subscriptions:</p>
                    <ul>
                        ${userNotifs.map(u => `<li><a href="${u.link}">${u.title}</a>: ${u.message}</li>`).join('')}
                    </ul>
                `;
                try {
                    await sendEmailNotification(userRecord.email, html);
                    console.log(`📧 Email sent to ${userRecord.email}`);
                    emailSent = true;
                } catch (emailErr) {
                    console.error(`Failed to send email to ${userRecord.email}:`, emailErr);
                }
            } else {
                console.log(`[Notification] No email found for User ${userId}.`);
            }

            // 4. Update Notification Objects with the Verified Auth ID
            const validNotifs = userNotifs.map(n => ({
                ...n,
                user_id: targetUserId
            }));

            // 5. Insert into DB (Bell Notification)
            const { error: notifErr } = await supabase.from("notifications").insert(validNotifs);

            if (notifErr) {
                if (notifErr.code === '23503' || (notifErr.message && notifErr.message.includes("foreign key"))) {
                    console.warn(`[Warning] Notification DB insert failed for User ${targetUserId} (FK Error). Bell notification skipped.`);
                } else {
                    console.error(`Error inserting notifications for ${targetUserId}:`, notifErr);
                }
            } else {
                console.log(`✅ Saved ${validNotifs.length} notifications to DB for User ${targetUserId}`);
            }
        }
    } else {
        console.log("[Notification] No matching subscriptions for today's releases.");
    }

    console.log("--- Global Update Check Finished ---");
};

export const initScheduler = () => {
    // Run once immediately on startup for testing/verification
    console.log("Running immediate update check on startup...");
    processUpdates();

    // Schedule: Every 6 hours at minute 0
    cron.schedule("0 */6 * * *", () => {
        processUpdates();
    });

    console.log("Cron Scheduler initialized: Running every 6 hours.");
};
