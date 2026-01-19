import fs from "fs";
import path, { dirname } from "path";
import process from "process";
import { fileURLToPath } from "url";

const repositoryItem = (
  filename,
  type,
  lookbehind = "",
  lookahead = "",
  multiwordPrefix = ""
) => {
  const keywords = fs
    .readFileSync(filename, "utf8")
    .split("\n")
    .filter((x) => x && !x.startsWith("#"));

  const name = path.basename(filename, ".txt");

  const multiWord = keywords.filter((w) => w.includes(" ")).join("|");
  const singleWord = keywords.filter((w) => !w.includes(" ")).join("|");

  const pat = `"${lookbehind}((\\"${multiwordPrefix}(?:${multiWord})\\")|((?<optionalquote>\\"?)(?:${singleWord})\\\\b\\\\k<optionalquote>))${lookahead}"`;

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
    ["events.txt", "support.function.event-handler", "(?<=\\\\t| )"], // events, triggers, & penalties (words following "on" or "to")
    ["keywords.txt", "meta.object-literal.key", "(?<=\\\\t| |^)", "(?= |$)"],
    [
      "attributes.txt", // keywords only defined and consumed via data files, not code (i.e. scenario, not engine)
      "variable.other",
      "(?<=^| |\\\\t)",
      "(?=$| )",
      "(?:requires )?", // this bit doesn't work
    ],
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

/*
BUGS:
  * The language parser does not correctly parse '<' or '>' outside of strings.
	* Strings in value positions that match keywords are highlighted as keywords:
      leak "leak" 60 60
	    leak "flame" 60 60
  * hull & test are not recognised if the sort order is alphabetical, they need to come last.
*/
