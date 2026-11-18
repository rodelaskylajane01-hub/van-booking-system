document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("seatForm");
  if (!form) return;
  const update = () => {
    const selected = [...form.querySelectorAll('input[name="seats"]:checked')];
    const count = selected.length;
    document.getElementById("seatCount").textContent = count ? selected.map(x=>x.value).join(", ") : "0";
    document.getElementById("seatTotal").textContent = "₱" + (count * Number(window.seatFare || 0)).toLocaleString();
    form.querySelectorAll('input[name="seats"]').forEach(input => {
      if (!input.disabled) input.nextElementSibling.classList.toggle("selected", input.checked);
    });
  };
  form.addEventListener("change", update);
  update();
});
