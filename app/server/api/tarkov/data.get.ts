export default defineCachedEventHandler(
  async (event) => {
    const query = getQuery(event);
    const lang = query.lang || "en";
    const gameMode = query.gameMode || "pve";

    try {
      const response = await $fetch("https://api.tarkov.dev/graphql", {
        method: "POST",
        body: {
          query: TARKOV_DATA_QUERY,
          variables: { lang, gameMode },
        },
      });

      return response;
    } catch (error) {
      console.error("Error fetching data from tarkov.dev:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to fetch data from tarkov.dev",
      });
    }
  },
  {
    maxAge: 60 * 60 * 12, // 12 hours
    swr: true,
    name: "tarkov-data",
    getKey: (event) => {
      const query = getQuery(event);
      const lang = query.lang || "en";
      const gameMode = query.gameMode || "pve";
      return `tarkov-data-${lang}-${gameMode}`;
    },
  }
);
