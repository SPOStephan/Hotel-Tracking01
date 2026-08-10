import { parseWebsiteUrl } from "../src/lib/hotels/website-url";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const a = parseWebsiteUrl("www.example.com/path");
assert(a.ok && a.url === "https://www.example.com/path", "adds https");

const b = parseWebsiteUrl("https://hotel.de/");
assert(b.ok && b.url === "https://hotel.de/", "keeps https");

const c = parseWebsiteUrl("");
assert(!c.ok, "empty fails");

console.log("smoke-website-url: ok");
