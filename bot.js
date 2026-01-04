import fetch from "node-fetch";
import TelegramBot from "node-telegram-bot-api";
import fs from "fs";

const TOKEN = process.env.TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

const file = "data.json";
const load = () => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : {};
const save = (d) => fs.writeFileSync(file, JSON.stringify(d));

function trend(oldV, newV) {
  if (!oldV) return "stable";
  if (newV > oldV) return "up";
  if (newV < oldV) return "down";
  return "stable";
}

async function getMarket() {
  const data = load();

  // DÓLAR OFICIAL
  const dolarRes = await fetch("https://dolarapi.com/v1/dolares/oficial");
  const dolar = (await dolarRes.json()).venta;
  const dolarTrend = trend(data.dolar, dolar);
  data.dolar = dolar;

  // INFLACIÓN INDEC
  const inflRes = await fetch(
    "https://apis.datos.gob.ar/series/api/series?ids=148.3_INIVELNAL_DICI_M_26"
  );
  const inflData = await inflRes.json();
  const inflation = inflData.data.at(-1)[1];
  const inflationTrend = trend(data.inflation, inflation);
  data.inflation = inflation;

  save(data);
  return { dolarTrend, inflationTrend };
}

function recommendation(t) {
  if (t.dolarTrend === "up" && t.inflationTrend === "up")
    return "📈 Dólar e inflación subiendo\n👉 Comprar: CEDEARs, Dólar MEP\n❌ Evitar: Pesos";

  if (t.dolarTrend === "down")
    return "💸 Dólar bajando\n👉 Comprar: Bonos en pesos, Acciones ARG";

  return "😐 Mercado estable\n👉 Esperar";
}

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "🤖 InverArg Señales activado");
});

bot.onText(/\/senal/, async (msg) => {
  const t = await getMarket();
  const r = recommendation(t);
  bot.sendMessage(msg.chat.id, r);
});