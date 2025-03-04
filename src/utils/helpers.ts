import {
	entersState,
	joinVoiceChannel,
	VoiceConnectionStatus,
	type VoiceConnection,
} from '@discordjs/voice';
import type { VoiceBasedChannel } from 'discord.js';

export async function connectToChannel(channel: VoiceBasedChannel): Promise<VoiceConnection> {
	const connection = joinVoiceChannel({
		adapterCreator: channel.guild.voiceAdapterCreator,
		channelId: channel.id,
		guildId: channel.guild.id,
	});

	try {
		await entersState(connection, VoiceConnectionStatus.Ready, 60_000);
    console.log("Voice connection established");
		return connection;
	} catch (error) {
    console.error("Failed to connect to voice channel:", error);
		connection.destroy();
		throw error;
	}
}
