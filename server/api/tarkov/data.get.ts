// Import the query from utils - auto-imported by Nitro
const TARKOV_DATA_QUERY = useServerQuery();

function useServerQuery() {
  return `
  fragment ItemData on Item {
    id
    shortName
    name
    link
    wikiLink
    image512pxLink
    gridImageLink
    baseImageLink
    iconLink
    image8xLink
    backgroundColor
  }
  fragment CategoryData on ItemCategory {
    id
    name
    normalizedName
  }
  fragment MapPositionData on MapPosition {
    x
    y
    z
  }
  fragment MapWithPositionsData on MapWithPosition {
    map {
      id
    }
    positions {
      ...MapPositionData
    }
  }
  fragment TaskZoneData on TaskZone {
    id
    map {
      id
    }
    position {
      ...MapPositionData
    }
    outline {
      ...MapPositionData
    }
    top
    bottom
  }
  query TarkovData($lang: LanguageCode, $gameMode: GameMode) {
    tasks(lang: $lang, gameMode: $gameMode) {
      id
      tarkovDataId
      name
      trader {
        id
        name
        imageLink
      }
      map {
        id
        name
      }
      kappaRequired
      lightkeeperRequired
      experience
      wikiLink
      minPlayerLevel
      taskRequirements {
        task {
          id
          name
        }
        status
      }
      traderRequirements {
        trader {
          id
          name
        }
        value
      }
      objectives {
        id
        description
        type
        maps {
          id
          name
        }
        optional
        __typename
        ... on TaskObjectiveBasic {
          zones {
            ...TaskZoneData
          }
        }
        ... on TaskObjectiveBuildItem {
          item {
            ...ItemData
            properties {
              ... on ItemPropertiesWeapon {
                defaultPreset {
                  ...ItemData
                }
              }
            }
          }
          containsAll {
            ...ItemData
          }
          containsCategory {
            ...CategoryData
            parent {
              ...CategoryData
            }
            children {
              ...CategoryData
            }
          }
          attributes {
            name
            requirement {
              compareMethod
              value
            }
          }
        }
        ... on TaskObjectiveExperience {
          healthEffect {
            bodyParts
            effects
            time {
              compareMethod
              value
            }
          }
        }
        ... on TaskObjectiveExtract {
          exitStatus
          zoneNames
        }
        ... on TaskObjectiveItem {
          zones {
            ...TaskZoneData
          }
          item {
            ...ItemData
            properties {
              ... on ItemPropertiesWeapon {
                defaultPreset {
                  ...ItemData
                }
              }
            }
          }
          count
          foundInRaid
          dogTagLevel
          maxDurability
          minDurability
        }
        ... on TaskObjectiveMark {
          markerItem {
            ...ItemData
          }
          zones {
            ...TaskZoneData
          }
        }
        ... on TaskObjectivePlayerLevel {
          playerLevel
        }
        ... on TaskObjectiveQuestItem {
          possibleLocations {
            ...MapWithPositionsData
          }
          zones {
            ...TaskZoneData
          }
          questItem {
            id
            name
          }
          count
        }
        ... on TaskObjectiveShoot {
          shotType
          targetNames
          count
          zoneNames
          bodyParts
          usingWeapon {
            ...ItemData
            properties {
              ... on ItemPropertiesWeapon {
                defaultPreset {
                  ...ItemData
                }
              }
            }
          }
          usingWeaponMods {
            ...ItemData
          }
          wearing {
            ...ItemData
          }
          notWearing {
            ...ItemData
          }
          distance {
            compareMethod
            value
          }
          playerHealthEffect {
            bodyParts
            effects
            time {
              compareMethod
              value
            }
          }
          enemyHealthEffect {
            bodyParts
            effects
            time {
              compareMethod
              value
            }
          }
          zones {
            ...TaskZoneData
          }
        }
        ... on TaskObjectiveSkill {
          skillLevel {
            name
            level
          }
        }
        ... on TaskObjectiveTaskStatus {
          task {
            id
            name
          }
          status
        }
        ... on TaskObjectiveTraderLevel {
          trader {
            id
            name
          }
          level
        }
        ... on TaskObjectiveUseItem {
          useAny {
            ...ItemData
          }
          zones {
            ...TaskZoneData
          }
          count
        }
      }
      startRewards {
        traderStanding {
          trader {
            id
            name
          }
          standing
        }
        items {
          count
          item {
            ...ItemData
            containsItems {
              item {
                ...ItemData
              }
              count
            }
          }
        }
        offerUnlock {
          id
          trader {
            id
            name
          }
          level
          item {
            ...ItemData
            containsItems {
              count
              item {
                ...ItemData
              }
            }
          }
        }
        skillLevelReward {
          name
          level
        }
        traderUnlock {
          id
          name
        }
      }
      finishRewards {
        traderStanding {
          trader {
            id
            name
          }
          standing
        }
        items {
          count
          item {
            ...ItemData
            containsItems {
              item {
                ...ItemData
              }
              count
            }
          }
        }
        offerUnlock {
          id
          trader {
            id
            name
          }
          level
          item {
            ...ItemData
            containsItems {
              count
              item {
                ...ItemData
              }
            }
          }
        }
        skillLevelReward {
          name
          level
        }
        traderUnlock {
          id
          name
        }
      }
      factionName
      neededKeys {
        keys {
          ...ItemData
        }
        map {
          id
          name
        }
      }
    }
    maps {
      id
      name
      tarkovDataId
      enemies
      wiki
      raidDuration
      players
      description
    }
    playerLevels {
      level
      exp
      levelBadgeImageLink
    }
    traders {
      id
      name
      resetTime
      imageLink
      levels {
        id
        level
        requiredPlayerLevel
        requiredReputation
        requiredCommerce
        insuranceRate
        payRate
        repairCostMultiplier
      }
    }
  }
`;
}

export default defineCachedEventHandler(
  async (event) => {
    const query = getQuery(event);
    const lang = (query.lang as string) || "en";
    const gameMode = (query.gameMode as string) || "pve";

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
      const lang = (query.lang as string) || "en";
      const gameMode = (query.gameMode as string) || "pve";
      return `tarkov-data-${lang}-${gameMode}`;
    },
  }
);
