import axios from "axios";

const checkAnilist = async (search) => {
    const query = `
    query ($search: String) {
      Media (search: $search, type: MANGA) {
        id
        title {
          romaji
          english
          native
        }
        status
        chapters
        volumes
        nextAiringEpisode {
             episode
        }
      }
    }
    `;

    try {
        const response = await axios.post("https://graphql.anilist.co", {
            query,
            variables: { search }
        });
        const m = response.data.data.Media;
        console.log(`\nTitle: ${m.title.english || m.title.romaji}`);
        console.log(`Status: ${m.status}`);
        console.log(`Chapters: ${m.chapters}`);
        console.log(`Volumes: ${m.volumes}`);
    } catch (err) {
        console.error("Error:", err.message);
    }
};

const run = async () => {
    await checkAnilist("One Piece");
    await checkAnilist("Jujutsu Kaisen");
};

run();
