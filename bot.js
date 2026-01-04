import TelegramBot from "node-telegram-bot-api";
import fetch from "node-fetch";

const TOKEN = process.env.TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

function trend(oldV, newV) {
  if (!oldV) return "stable";
  if (newV > oldV) return "up";
  if (newV < oldV) return "down";
  return "stable";
}

let lastDolar = null;

async function getSignal() {
  const res = await fetch("https://dolarapi.com/v1/dolares/oficial");
  const data = await res.json();
  const dolar = data.venta;

  const dolarTrend = trend(lastDolar, dolar);
  lastDolar = dolar;

  if (dolarTrend === "up") {
    return "📈 Sube el dólar\n👉 Comprar: CEDEARs / Dólar MEP";
  }

  if (dolarTrend === "down") {
    return "📉 Baja el dólar\n👉 Comprar: Bonos en pesos / Acciones ARG";
  }

  return "😐 Sin señal fuerte\n👉 Esperar";
}

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "🤖 InverArg Señales activo");
});

bot.onText(/\/senal/, async (msg) => {
  const signal = await getSignal();
  bot.sendMessage(msg.chat.id, signal);
});