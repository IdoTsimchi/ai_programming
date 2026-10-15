const timeEl = document.getElementById("time");
const dateEl = document.getElementById("date");

function pad(n) {
  return String(n).padStart(2, "0");
}

function tick() {
  const now = new Date();
  timeEl.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  dateEl.textContent = now.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  // Re-run right at the next second boundary to stay in sync.
  setTimeout(tick, 1000 - now.getMilliseconds());
}

tick();
