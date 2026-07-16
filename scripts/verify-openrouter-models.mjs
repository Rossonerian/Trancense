const response = await fetch("https://openrouter.ai/api/v1/models");
if (!response.ok) throw new Error(`OpenRouter catalogue returned HTTP ${response.status}`);
const payload = await response.json();
const now = Date.now();
const free = payload.data.filter((model) => model.architecture?.modality === "text->text" && model.pricing?.prompt === "0" && model.pricing?.completion === "0" && (!model.expiration_date || Date.parse(model.expiration_date) > now)).map((model) => model.id);
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), count: free.length, modelChain: free.slice(0, 5).join(",") }, null, 2));
