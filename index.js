const SteamUser = require("steam-user");
const CronJob = require("cron").CronJob;
const config = require("./config.json");
let servers = require("./servers.json");
const valveids = require("./allids.json");
//ACTUALLY DEVS, NOT RANDOMS
const randomids = require("./randoms.json");
const fs = require("fs");
var client = new SteamUser();

const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const bot = new Client({ intents: [GatewayIntentBits.Guilds] });

bot.once("ready", () => {
	console.log("Discord bot ready!");
	bot.user.setPresence({ activities: [{ name: "/help for all commands" }] });
});

if (config.twofa) {
	client.logOn({
		accountName: config.user,
		password: config.pass,
		twoFactorCode: config.twofa,
	});
} else {
	client.logOn({
		accountName: config.user,
		password: config.pass,
	});
}

let foundUsers = [];
let prevFoundByID = [];
let gameName = ["CS:GO Public", "CS:GO Dev"];
let running = false;

client.on("loggedOn", function (details) {
	console.log("Logged into Steam as " + client.steamID.getSteam3RenderedID());
	client.setPersona(SteamUser.EPersonaState.Online);
	if (!running) start();
});

let start = () => {
	running = true;
	getRichPresence([730, 710], 0);

	var job = new CronJob(
		"* * * * *",
		function () {
			foundUsers = [];
			getRichPresence([730, 710], 0);
		},
		null,
		true,
		"America/Los_Angeles"
	);
};

const getRichPresence = (appID, iteration) => {
	if (iteration == appID.length) forwardInfo(foundUsers);
	else {
		client.requestRichPresence(appID[iteration], valveids.all, (err, response) => {
			if (!err) {
				if (Object.keys(response.users).length >= 1) {
					for (let key in response.users) {
						let user = {
							id: key,
							game: gameName[iteration],
							statusLocalized: response.users[key].localizedString,
							status: response.users[key].richPresence.status,
							state: response.users[key].richPresence["game:state"],
							version: response.users[key].richPresence.version,
							app: appID[iteration],
							mode: response.users[key].richPresence["game:mode"],
							group: response.users[key].richPresence["game:mapgroupname"],
							map: response.users[key].richPresence["game:map"],
							server: response.users[key].richPresence["game:server"],
						};

						//DEV DEV
						if (appID[iteration] == 710) {
							user.dev = "CS DEV";
							user.who = "devBranch";
							foundUsers.push(user);
						}
						//DEV ALL
						else if (randomids.all.includes(user.id)) {
							user.dev = "CS DEV";
							user.who = "devAll";
							foundUsers.push(user);
						}
						//VALVE ALL
						else {
							user.dev = "VALVE EMPLOYEE";
							user.who = "all";
							foundUsers.push(user);
						}

						if (key == Object.keys(response.users)[Object.keys(response.users).length - 1]) {
							getRichPresence(appID, iteration + 1);
						}
					}
				} else getRichPresence(appID, iteration + 1);
			} else {
				console.log(err);
				sendErr(err);
			}
		});
	}
};

const sendErr = async (error) => {
	await bot.channels.cache.get("924300455851458562").send(JSON.stringify(error));
};

const forwardInfo = (userInfos) => {
	if (userInfos.length > 0) {
		let newInfo = [];
		if (prevFoundByID.length > 0) {
			userInfos.forEach((user) => {
				let prevInfo = prevFoundByID.find((prev) => prev.id === user.id);
				if (prevInfo && prevInfo.id === user.id) {
					if (prevInfo.map == user.map && prevInfo.group == user.group) {
						console.log("SAME MAP", user.map, user.group);
					} else {
						console.log("DIFFERENT MAP", user.map, user.group);
						newInfo.push(user);
					}
				}
			});
			if (newInfo.length > 0) sendAlert(newInfo, true);
		} else sendAlert(userInfos);
		console.log("FOUND " + userInfos.length + " DEVELOPER ACCOUNT(S) PLAYING CS");
		prevFoundByID = userInfos;
	} else {
		console.log("NO USERS FOUND");
		prevFoundByID = [];
	}
};

const sendAlert = async (info, mapChanged) => {
	info.forEach(async (e) => {
		let alertEmbed = await createEmbed(e, mapChanged);
		try {
			bot.guilds.cache.forEach((guild) => {
				// Find settings
				let settings = servers.find((setting) => setting.id == guild.id);
				if (settings.stop) return;
				if (
					(settings.who == "devBranch" && e.who == "devBranch") ||
					(settings.who == "devAll" && (e.who == "devAll" || e.who == "devBranch")) ||
					settings.who == "all"
				) {
					if (settings.channel == "No channel selected") {
						let channel = guild.channels.cache.find((ch) => ch.type === 0); // Send to first text channel available
						channel.send({ embeds: [alertEmbed] });
					} else {
						if (guild.id == "924300455151034429") {
							bot.channels.cache
								.get(settings.channel)
								.send({ content: e.id, embeds: [alertEmbed] });
						} else {
							bot.channels.cache.get(settings.channel).send({ embeds: [alertEmbed] });
						}
					}
				}
			});
		} catch (err) {
			console.log("Could not send message to guild");
			console.log(err);
		}
		//await bot.channels.cache.get("924300455851458562").send({ embeds: [alertEmbed] });
	});
};

const createEmbed = async (info, mapChanged) => {
	console.log(info);
	let title = "SOMETHING NEW HAPPENED!";
	if (mapChanged) title = info.dev + " CHANGED MAP/MAPGROUP!";
	else title = info.dev + " STARTED PLAYING!";
	let desc = `***General info:***\n`;
	//${info.id}
	if (info.id) desc = desc + `👨‍🔬 **ID:** ||⬛⬛⬛⬛⬛⬛⬛⬛||\n`;
	if (info.game) desc = desc + `🕹 **Game:** ${info.game}\n`;
	if (info.status) desc = desc + `ℹ **Info:** ${info.status}\n`;
	if (info.statusLocalized) desc = desc + `⏺ **Status:** ${info.statusLocalized}\n`;
	if (info.state)
		desc = desc + `⭕ **State**: ${info.state.charAt(0).toUpperCase() + info.state.slice(1)}\n`;
	desc = desc + `\n***In-depth info:***`;

	let alertEmbed = new EmbedBuilder()
		.setTitle(title)
		.setDescription(desc)
		.setThumbnail("https://i.imgur.com/tVO9yYh.png")
		.setTimestamp()
		.setFooter({ text: "Grabbed by CSDevAlerts", iconURL: "https://i.imgur.com/tVO9yYh.png" });

	if (info.map)
		alertEmbed.addFields({
			name: "🗺 Map:",
			value: info.map.toUpperCase(),
			inline: true,
		});
	if (info.group) {
		alertEmbed.addFields({
			name: "🔗 Mapgroup:",
			value: info.group.toUpperCase(),
			inline: info.group.length > 30 ? false : true,
		});
	}
	if (info.mode)
		alertEmbed.addFields({
			name: "🏅 Mode:",
			value: info.mode.charAt(0).toUpperCase() + info.mode.slice(1),
			inline: true,
		});
	if (info.app) {
		alertEmbed.addFields({ name: "🎮 App:", value: info.app.toString(), inline: true });
		info.app == 710 ? alertEmbed.setColor("#7EFA02") : alertEmbed.setColor("#808080");
	}
	if (info.version)
		alertEmbed.addFields({ name: "📦 Version:", value: info.version, inline: true });
	if (info.server)
		alertEmbed.addFields({
			name: "🖥 Server:",
			value:
				info.server == "kv" ? "KV" : info.server.charAt(0).toUpperCase() + info.server.slice(1),
			inline: true,
		});
	alertEmbed.addFields({
		name: "\u200B",
		value: "```ansi\n[2;34mMade with 💙 by @Wilzzu[0m\n```",
	});
	//[@Wilzzu](https://twitter.com/Wilzzu
	return alertEmbed;
};

client.on("error", function (e) {
	// Some error occurred during logon
	console.log(e);
});

bot.on("interactionCreate", async (interaction) => {
	if (!interaction.isChatInputCommand()) return;
	const { commandName } = interaction;

	if (commandName === "status") {
		await interaction.reply("CSDevAlerts is up and running!");
	}
	//
	else if (commandName === "here") {
		let index = servers.findIndex((e) => e.id == interaction.guildId);
		servers[index].channel = interaction.channelId;
		fs.writeFileSync("./servers.json", JSON.stringify(servers, null, 2));
		await interaction.reply("Alert channel set! You will now receive alerts here!");
	}
	//
	else if (commandName === "stop") {
		let index = servers.findIndex((e) => e.id == interaction.guildId);
		servers[index].stop = true;
		fs.writeFileSync("./servers.json", JSON.stringify(servers, null, 2));
		await interaction.reply("You wont receive alerts anymore!");
	}
	//
	else if (commandName === "continue") {
		let index = servers.findIndex((e) => e.id == interaction.guildId);
		servers[index].stop = false;
		fs.writeFileSync("./servers.json", JSON.stringify(servers, null, 2));
		await interaction.reply("You will receive alerts again!");
	}
	//
	else if (commandName === "help") {
		let helpEmbed = new EmbedBuilder()
			.setTitle("Commands for CSDevAlerts!")
			.setDescription(
				"📨 **/here** - Type this command in the channel you want to receive alerts at!\n👨‍🔬 **/who** - Select who should trigger an alert!\n❌ **/stop** - Stop receiving alerts!\n✅ **/continue** - Continue receiving alerts again!\n🖥 **/status** - Check if CSDevAlerts is running!\nℹ **/help** - Show all commands for CSDevAlerts!"
			)
			.setThumbnail("https://i.imgur.com/tVO9yYh.png");
		await interaction.reply({ embeds: [helpEmbed] });
	}
	//
	else if (commandName === "who") {
		let choice = interaction.options._hoistedOptions[0].value;
		let res = "";
		if (choice == "who_devAll") {
			let index = servers.findIndex((e) => e.id == interaction.guildId);
			servers[index].who = "devAll";
			fs.writeFileSync("./servers.json", JSON.stringify(servers, null, 2));
			res = "from CS devs on public and dev branches [730 + 710]!";
		}
		if (choice == "who_devBranch") {
			let index = servers.findIndex((e) => e.id == interaction.guildId);
			servers[index].who = "devBranch";
			fs.writeFileSync("./servers.json", JSON.stringify(servers, null, 2));
			res = "only from dev branch [710]!";
		}
		if (choice == "who_all") {
			let index = servers.findIndex((e) => e.id == interaction.guildId);
			servers[index].who = "all";
			fs.writeFileSync("./servers.json", JSON.stringify(servers, null, 2));
			res = "from all Valve employees on any branch!";
		}
		await interaction.reply("You will now receive alerts " + res);
	}
});

bot.on("guildCreate", (guild) => {
	console.log("ADDED TO GUILD");
	if (servers.find((e) => e.id == guild.id)) return;
	else {
		console.log("NEW GUILD");
		let temp = servers;
		let addGuild = {
			id: guild.id,
			channel: "No channel selected",
			stop: false,
			who: "devAll",
		};
		temp.push(addGuild);
		fs.writeFileSync("./servers.json", JSON.stringify(temp, null, 2));
	}
	//guild.systemChannel.send(`yo`);
});

bot.login(config.token);
