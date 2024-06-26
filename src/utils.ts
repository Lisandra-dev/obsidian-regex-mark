export function removeTags(regex: string) {
	return regex.replace(/{{open:(.*?)}}/, "$1").replace(/{{close:(.*?)}}/, "$1");
}

export const isInvalid = (regex: string) => {
	return regex.match(/(.*)\[\^(.*)\](.*)/) && !regex.match(/(.*)\[\^(.*)\\n(.*)\](.*)/);
};

export function isValidRegex(regex: string, warn = true) {
	if (isInvalid(regex)) {
		return false;
	}
	try {
		new RegExp(removeTags(regex));
		return true;
	} catch (_e) {
		if (warn) console.warn(`Invalid regex: ${regex}`);
		return false;
	}
}

export function hasToHide(regex: string) {
	//search for group in regex
	const group = removeTags(regex).match(/\((.*?)\)/);
	if (!group) return false;
	return true;
}
