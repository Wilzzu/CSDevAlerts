![Banner](https://i.imgur.com/0u6aWKZ.png)

<h1 align="center">CSDevAlerts</h1>

<p align="center">Discord bot that sends a notification whenever a Valve developer starts playing CS:GO.</br> Shows the current map, gamemode, game version, and other information.</p>

> [!WARNING]
> Valve has disabled Rich Presence information showing to non-friends on October 2022. You now have to be friends with the developers to see their game status.

## Features

- Sends a notification when a Valve developer starts CS:GO.
- Displays the current map or their game status.
- Shows more info such as gamemode, game version, mapgroup, app ID, and server info.
- Randomizes developer names for privacy.
- You can select the channel where the bot should post notifications.
- Configure what events should trigger a notification.

## Setup and Installation

### Prerequisites

- [Node](https://nodejs.org/) - `v16.11.0` or higher
- [npm](https://www.npmjs.com/)
- A Discord bot token (Get one by creating a bot on the [Discord Developer Portal](https://discord.com/developers/applications))
- Steam account that isn't limited (Spend at least $5 on the [Steam](https://store.steampowered.com/) account)

### Installation

1. **Clone the repository:**

   ```
   git clone https://github.com/Wilzzu/CSDevAlerts.git
   cd CSDevAlerts
   ```

2. **Install dependencies:**

   ```
   npm install
   ```

3. **Configure environment variables:**

   Rename the `.env.example` file to `.env` and fill in the required values:

   | Variable                   | Description                                                                                                    |
   | -------------------------- | -------------------------------------------------------------------------------------------------------------- |
   | `STEAM_USERNAME`           | Steam account username.                                                                                        |
   | `STEAM_PASSWORD`           | Steam account password.                                                                                        |
   | `DISCORD_TOKEN`            | Bot token found in `Bot` > `Token` in your Discord Developer Portal application.                               |
   | `DISCORD_APPLICATION_ID`   | Application ID found in `General Information` > `Application ID` in your Discord Developer Portal application. |
   | `DISCORD_PRIVATE_GUILD_ID` | ID of a private Discord server where the bot will post notifications without hiding the developer's SteamID.   |

4. **Setup config files:**

   - Rename all `<name>.json.example` files in the `configs` folder to `<name>.json`.
   - Add the SteamIDs of the CS developers you want to track in the `csdevs.json` file. The ID's should be in `SteamID64` format.
   - Add other Valve developers' SteamIDs in the `allids.json` file. The ID's should be in `SteamID64` format.

5. **Deploy slash commands:**

   ```
   npm run deploy-commands
   ```

6. **Start the bot:**

   > [!WARNING]
   > Before starting to bot, if you want to ensure the randomly generated names remain random and unique, you should modify the values within the hash function (`randomizeId()`). Since this bot is public, using default values may enable others to figure out the original SteamIDs.

   ```
   npm run start
   ```

## Usage

The bot is easy to set up and use. Once you have the bot running, you can use the following commands:

- `/here` - Go to the channel where you want the bot to post notifications and run this command to set the notification channel.
- `/who` - Configure who should trigger a notification. You can choose between:
  - CS developer on public or developer branches `[730 + 710]`
  - Any Valve developer on the developer branch `[710]`
  - Any Valve developer on any branch

That's it! The bot will now send notifications to the channel you specified whenever the selected developers start playing CS:GO.

## Other Commands

- `/status` - Check if the bot is running.
- `/stop` - Stop receiving alerts.
- `/continue` - Continue receiving alerts again.
- `/help` - Show all commands for the bot.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
