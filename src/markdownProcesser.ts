import { SettingOption } from "./setting";
import { isValidRegex, removeTags } from "./utils";

export function MarkdownProcesser(data: SettingOption[], element: HTMLElement) {
	const paragraph = element.findAll("p, li, h1, h2, h3, h4, h5, h6, td, .callout-title-inner");
	paragraph.push(...element.findAllSelf(".table-cell-wrapper"));

	for (const p of paragraph) {
		let ignore = true;
		for (const d of data) {
			if (!d.regex || !d.class || d.regex === "" || d.class === "" || !isValidRegex(d.regex))
				continue;
			const regex = new RegExp(removeTags(d.regex));
			if (regex.test(p.textContent || "")) {
				ignore = false;
				break;
			}
		}
		if (ignore)
			continue;

		const treeWalker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
		const textNodes = [];
		while (treeWalker.nextNode()) {
			textNodes.push(treeWalker.currentNode);
		}
		for (const node of textNodes) {
			const text = node.textContent;
			const items: { classes: string, data: string }[] = [];
			if (text) {
				for (const d of data) {
					if (!d.regex || !d.class || d.regex === "" || d.class === "")
						continue;
					const regex = new RegExp(removeTags(d.regex));
					if (!d.hide){
						items.push({ classes: d.class, data: text });
					}
					else {
						const group = removeTags(d.regex).match(/\((.*?)\)/);
						if (!group)
							continue;						
						items.push({ classes: d.class, data: text.replace(regex, "$1")});
					}
				}
				const span = document.createElement("span");
				for (const item of items) {
					span.innerText = item.data;
					span.addClass(item.classes);
					span.setAttribute("data-contents", item.data);
				}
				if (node.parentNode)
					node.parentNode.replaceChild(span, node);
			}
		}
	}
}