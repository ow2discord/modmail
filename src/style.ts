export const Emoji = {
	CheckBadge: "<:Official:944773335882031175>",
	Megaphone: "📣",
	Alert: "<:Alert:1466320245810663528>",
	Muted: "<:Muted:1466317143531327683>",
	Discord: "<:Discord:1466325410080886844>",
	Overwatch: "<:Overwatch:1466317117476573288>",
	Banned: "<:Banned:1049947904833507368>",
	Docs: "<:Docs:1172077218260848690>",
	Verified: "<:Verified:1466317991183515802>",
	Modmail: "<:ModMail:1466317685926269043>",
	Notepad: "🗒️",
	Roles: {
		LFGTool: "<:LFGTool:1466324267279847454>",
		Grey: "<:RoleGrey:1466318934352461879>",
		VishkarBlue: "<:VishkarBlue:1466318900038991924>",
		OladeleGreen: "<:OladeleGreen:1466318306746040375>",
		GuilliardPurple: "<:GuillardPurple:1466318278958907412>",
		HelixYellow: "<:HelixYellow:1466318253772243170>",
		KamoriTeal: "<:KamoriTeal:1466318209815941170>",
		Omnic: "<:Omnic:1466317957503389798>",
		Coach: "<:Coach:1466317887362039972>",
		CoachTrainee: "<:CoachTrainee:1466317873395007722>",
		Blizzard: "<:Blizzard:1466317831858688030>",
		Admin: "<:Admin:1466317744168239400>",
		Moderator: "<:Moderator:1466317729442037893>",
		Trainee: "<:Trainee:1466317717597458512>",
		Distinguished: "<:Distinguished:1466317772513480839>",
		NitroBooster: "<:NitroBooster:1466323278678200557>",
		FaceIt: "<:FACEIT:1466322454925410318>",
		Decennial: "<:Decennial:1466322113001685103>",
		Quinquennial: "<:Quinquennial:1466319740568862740>",
		EventWinner: "<:EventWinner:1466319423815159808>",
	},
};

export const Colours = {
	Red: "#DA3E44",
	Orange: "#F06414",
};

const roleMap = {
	Admin: `${Emoji.Roles.Admin} Admin`,
	Moderator: `${Emoji.Roles.Moderator} Moderator`,
	Trainee: `${Emoji.Roles.Trainee} Trainee`,
	Blizzard: `${Emoji.Overwatch} Blizzard`,
	"Subreddit Mod": `${Emoji.Roles.Moderator} Subreddit Mod`,
	"Event Winner": `${Emoji.Roles.EventWinner} Event Winner`,
	"Helix Yellow": `${Emoji.Roles.HelixYellow} Helix Yellow`,
	"Guillard Purple": `${Emoji.Roles.GuilliardPurple} Guillard Purple`,
	"Oladele Green": `${Emoji.Roles.OladeleGreen} Oladele Green`,
	"Kamori Teal": `${Emoji.Roles.KamoriTeal} Kamori Teal`,
	"Vishkar Blue": `${Emoji.Roles.VishkarBlue} Vishkar Blue`,
	Distinguished: `${Emoji.Roles.Distinguished} Distinguished`,
	Accomplished: `${Emoji.Roles.Grey} Accomplished`,
	Regular: `${Emoji.Roles.Grey} Regular`,
	Verified: `${Emoji.Verified} Verified`,
	FACEIT: `${Emoji.Roles.FaceIt} FACEIT`,
	"LFG Tool Dev": `${Emoji.Roles.LFGTool} LFG Tool Dev`,
	"Esports Org": "Esports Org",
	"Event Host": "Event Host",
	"Head Coach": `${Emoji.Roles.Coach} Head Coach`,
	Coach: `${Emoji.Roles.Coach} Coach`,
	"Coach Trainee": `${Emoji.Roles.CoachTrainee} Coach Trainee`,
	Decennial: `${Emoji.Roles.Decennial} Decennial`,
	Quinquennial: `${Emoji.Roles.Quinquennial} Quinquennial`,
	Veteran: `${Emoji.Roles.Grey} Veteran`,
	"Nitro Booster": `${Emoji.Roles.NitroBooster} Nitro Booster`,
	"Esports Announcement Coordinator": "Esports Announcement Coordinator",
	"Server Events Mute": "Server Events Mute",
	"Overwatch Announcements": "Overwatch Announcements",
	"Server Announcements": "Server Announcements",
	"Server Events": "Server Events",
	"PC Tournaments": "PC Tournaments",
	"Console Tournaments": "Console Tournaments",
	"LFG (PC - NA)": "LFG (PC - NA)",
	"LFG (PC - EU)": "LFG (PC - EU)",
	"LFG (PC - OCE/AS)": "LFG (PC - OCE/AS)",
	"LFG (Console)": "LFG (Console)",
	"Team Recruitment (NA)": "Team Recruitment (NA)",
	"Team Recruitment (EU)": "Team Recruitment (EU)",
	"Coaching & Advice": "Coaching & Advice",
};

export function localRole(roleName: string): string | null {
	for (const [key, value] of Object.entries(roleMap))
		if (key.endsWith(roleName)) return value;

	return null;
}

export function sortRoles(roles: Array<string>): Array<string> {
	const objValues = Object.values(roleMap);
	return roles.sort((a, b) => objValues.indexOf(a) - objValues.indexOf(b));
}
