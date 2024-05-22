const { SlashCommandBuilder, Routes } = require("discord.js");
const { REST } = require("@discordjs/rest");
require("dotenv").config();

const commands = [
	new SlashCommandBuilder().setName("status").setDescription("Check if CSDevAlerts is running!"),
	new SlashCommandBuilder()
		.setName("here")
		.setDescription("Type this command in the channel you want to receive alerts at!"),
	new SlashCommandBuilder().setName("stop").setDescription("Stop receiving alerts!"),
	new SlashCommandBuilder().setName("continue").setDescription("Continue receiving alerts again!"),
	new SlashCommandBuilder().setName("help").setDescription("Show all commands for CSDevAlerts!"),
	new SlashCommandBuilder()
		.setName("who")
		.setDescription("Select who should trigger an alert!")
		.addStringOption((option) =>
			option
				.setName("category")
				.setDescription("Select")
				.setRequired(true)
				.addChoices(
					{ name: "CS devs on public and dev branches [730 + 710]", value: "who_devAll" },
					{ name: "Only dev branch [710]", value: "who_devBranch" },
					{ name: "All Valve employees", value: "who_all" }
				)
		),
].map((command) => command.toJSON());

const private = [new SlashCommandBuilder().setName("update").setDescription("Update JSONs")].map(
	(command) => command.toJSON()
);

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

rest.put(
	Routes.applicationGuildCommands(
		process.env.DISCORD_APPLICATION_ID,
		process.env.DISCORD_PRIVATE_GUILD_ID
	),
	{
		body: private,
	}
);
rest.put(Routes.applicationCommands(process.env.DISCORD_APPLICATION_ID), { body: commands });
