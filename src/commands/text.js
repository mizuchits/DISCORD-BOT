const { SlashCommandBuilder } = require("@discordjs/builders");
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("text")
    .setDescription("Open a modal to input text."),
  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId("textInputModal")
      .setTitle("Écris ton message");

    const textInput = new TextInputBuilder()
      .setCustomId("userMessage")
      .setLabel("Ton message :")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Tape ici ce que tu veux que le bot répète")
      .setRequired(true);

    const firstActionRow = new ActionRowBuilder().addComponents(textInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
  },
};