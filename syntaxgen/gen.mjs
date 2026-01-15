import fs from "fs";
import path, { dirname } from "path";
import process from "process";
import { fileURLToPath } from "url";

const repositoryItem = (filename, type, prefix = "", postfix = "") => {
  const keywords = fs
    .readFileSync(filename, "utf8")
    .split("\n")
    .filter((x) => x && !x.startsWith("#"));

  const name = path.basename(filename, ".txt");

  const multiWord = keywords.filter((w) => w.includes(" ")).join("|");
  const singleWord = keywords.filter((w) => !w.includes(" ")).join("|");

  const pat = `"${prefix}((\\"(${multiWord})\\")|((?<optionalquote>\\"?)(${singleWord})\\\\b\\\\k<optionalquote>))${postfix}"`;

  return `
		"${name}": {
			"patterns": [
				{
					"name": "${type}.endlesssky",
					"match": ${pat}
				}
			]
		},`;
};

const language = () => {
  const files = [
    ["events.txt", "support.function.event-handler", "(?<=\\\\t|  )"],
    ["indentedKeys.txt", "meta.object-literal.key", `(?<=\\\\t|  )`],
    ["topLevelKeys.txt", "meta.object-literal.key", `^`],
  ];
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const template = fs.readFileSync(
    __dirname + "/template.tmLanguage.json",
    "utf8"
  );
  const repositoryHeader = '\n\t"repository": {';
  const insertionPoint =
    template.indexOf(repositoryHeader) + repositoryHeader.length;
  if (insertionPoint === -1) {
    throw new Error("bad repository header or template");
  }

  return (
    template.slice(0, insertionPoint) +
    files
      .map(([f, ...params]) => repositoryItem(__dirname + "/" + f, ...params))
      .join("") +
    template.slice(insertionPoint)
  );
};

process.stdout.write(language());
