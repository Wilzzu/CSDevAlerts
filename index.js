const SteamUser = require("steam-user");
const CronJob = require("cron").CronJob;
const config = require("./config.json");
const valveids = require("./allids.json");
const randomids = require("./randoms.json");
var client = new SteamUser();

const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const bot = new Client({ intents: [GatewayIntentBits.Guilds] });

bot.once("ready", () => {
	console.log("Discord bot ready!");
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

client.on("loggedOn", function (details) {
	console.log("Logged into Steam as " + client.steamID.getSteam3RenderedID());
	client.setPersona(SteamUser.EPersonaState.Online);
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
});

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
						console.log("FOUND");

						if (randomids.all.includes(user.id) && appID[iteration] == 730) {
							console.log("Found user but they aren't in dev branch");
						} else foundUsers.push(user);

						if (key == Object.keys(response.users)[Object.keys(response.users).length - 1]) {
							getRichPresence(appID, iteration + 1);
						}
					}
				} else getRichPresence(appID, iteration + 1);
			} else {
				console.log(err);
				getRichPresence(appID, iteration + 1);
			}
		});
	}
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
				let channel = guild.channels.cache.find((e) => e.type === 0); // Send to first text channel available
				channel.send({ embeds: [alertEmbed] });
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
	if (mapChanged) title = "CS DEV CHANGED MAP!";
	else title = "CS DEV STARTED PLAYING!";
	desc = `***General info:***\n👨‍🔬 **ID:** ||${info.id}||\n🕹 **Game:** ${info.game}\nℹ **Info:** ${
		info.status
	}\n⏺ **Status:** ${info.statusLocalized}\n⭕ **State**: ${
		info.state.charAt(0).toUpperCase() + info.state.slice(1)
	}\n\n***In-depth info:***`;
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

bot.login(config.token);
