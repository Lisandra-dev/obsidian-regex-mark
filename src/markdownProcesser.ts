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
			const items: { classes: string, data: string, text: string }[] = [];
			if (text) {
				for (const d of data) {
					if (!d.regex || !d.class || d.regex === "" || d.class === "")
						continue;
					const regex = new RegExp(removeTags(d.regex));
					if (!d.hide){
						items.push({ classes: d.class, data: text, text});
					}
					else {
						const group = removeTags(d.regex).match(/\((.*?)\)/);
						const dataText = regex.exec(text);
						if (!group || !dataText || !dataText?.[1])
							continue;
						items.push({ classes: d.class, data: dataText[1], text: text.replace(dataText[0], "")});
					}
				}
				const span = document.createElement("span");
				//expected result:
				//text = "y^x"
				//y<span class="super">x</span>
				for (const item of items) {
					span.setText(item.text);
					const spanInner = document.createElement("span");
					spanInner.className = item.classes;
					spanInner.setText(item.data);
					span.appendChild(spanInner);
				}
				if (node.parentNode)
					node.parentNode.replaceChild(span, node);
			}
		}
	}
}