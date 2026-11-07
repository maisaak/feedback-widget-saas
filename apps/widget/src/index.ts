export type FeedbackWidgetConfig = {
  apiKey: string;
  apiUrl?: string;
  position?: "bottom-right" | "bottom-left";
  accentColor?: string;
  title?: string;
  locale?: "en" | "ru";
};

const STRINGS = {
  en: {
    trigger: "Feedback", title: "Share feedback", close: "Close feedback",
    message: "Your feedback", rating: "Rating (optional)", email: "Email (optional)",
    cancel: "Cancel", submit: "Submit", sending: "Sending…",
    success: "Thanks, we received your feedback.",
    required: "Please write a message.", length: "Please enter between 1 and 5000 characters.",
    invalidEmail: "Enter a valid email address.",
    unauthorized: "This widget is not configured correctly.",
    rateLimit: "Too many messages, try again in a minute.",
    invalid: "Please check the form and try again.", generic: "Could not send feedback. Try again.",
    star: "star", stars: "stars",
  },
  ru: {
    trigger: "Отзыв", title: "Поделиться отзывом", close: "Закрыть форму отзыва",
    message: "Ваш отзыв", rating: "Оценка (необязательно)", email: "Email (необязательно)",
    cancel: "Отмена", submit: "Отправить", sending: "Отправляем…",
    success: "Спасибо, отзыв получен.",
    required: "Напишите сообщение.", length: "Введите от 1 до 5000 символов.",
    invalidEmail: "Укажите корректный email.",
    unauthorized: "Виджет настроен некорректно.",
    rateLimit: "Слишком много сообщений. Попробуйте через минуту.",
    invalid: "Проверьте форму и попробуйте снова.", generic: "Не удалось отправить отзыв. Попробуйте снова.",
    star: "звезда", stars: "звезды",
  },
};

export function init(config: FeedbackWidgetConfig): void {
  if (typeof document === "undefined") return;
  if (document.getElementById("feedback-widget-root")) return;
  if (!config.apiKey?.trim()) throw new Error("Feedback Widget requires an apiKey.");
  if (!document.body) {
    document.addEventListener("DOMContentLoaded", () => init(config), { once: true });
    return;
  }
  const host = document.createElement("div");
  const locale = config.locale === "ru" ? "ru" : "en";
  const strings = STRINGS[locale];
  host.lang = locale;
  host.id = "feedback-widget-root";
  const side = config.position === "bottom-left" ? "left" : "right";
  host.style.cssText = `all:initial;position:fixed;${side}:20px;bottom:20px;z-index:2147483647;`;
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `
    <style>
      :host{all:initial}*{box-sizing:border-box} [hidden]{display:none!important}
      .widget{font:14px/1.5 system-ui,sans-serif;color:#0f172a;color-scheme:light}
      button,input,textarea{font:inherit}button{cursor:pointer}button:disabled{cursor:wait;opacity:.6}
      button:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid #60a5fa;outline-offset:3px}
      .trigger,.submit{background:var(--accent);color:white;border:0;font-weight:600}
      .trigger{display:flex;align-items:center;gap:9px;border-radius:999px;padding:13px 20px;box-shadow:0 4px 20px #0003}
      .panel{position:absolute;${side}:0;bottom:64px;width:min(360px,calc(100vw - 40px));max-height:calc(100dvh - 110px);overflow:auto;background:white;border:1px solid #e2e8f0;border-radius:16px;padding:22px;box-shadow:0 12px 48px #0003;animation:appear .15s ease-out}
      h2{font-size:18px;line-height:1.4;margin:0 0 18px;padding-right:25px}.close{position:absolute;right:14px;top:12px;border:0;background:transparent;font-size:24px;color:#475569}
      label,.label{display:block;font-weight:600;margin:12px 0 6px}input,textarea{display:block;width:100%;border:1px solid #94a3b8;border-radius:8px;padding:10px;background:#fff;color:#0f172a}textarea{resize:vertical;min-height:110px;max-height:240px}
      .stars{display:flex;gap:5px}.star{font-size:27px;line-height:1.2;background:transparent;border:0;padding:3px;color:#64748b}.star[aria-pressed=true]{color:var(--accent)}
      .error{color:#b91c1c;margin:12px 0;min-height:21px}.actions{display:flex;justify-content:flex-end;gap:10px}.actions button{border-radius:8px;padding:9px 15px}.cancel{background:white;border:1px solid #cbd5e1;color:#334155}.submit{border:0}
      .success{text-align:center;padding:24px 0}.check{font-size:36px;color:#15803d}
      @keyframes appear{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
    </style>
    <div class="widget">
      <button class="trigger" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="feedback-panel"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-3 3V11.5a10 10 0 0 1 20 0Z"/></svg>${strings.trigger}</button>
      <section class="panel" id="feedback-panel" role="dialog" aria-modal="false" hidden>
        <button class="close" type="button" aria-label="${strings.close}">×</button>
        <h2></h2>
        <form novalidate>
          <label for="message">${strings.message}</label><textarea id="message" required maxlength="5000" aria-describedby="feedback-error"></textarea>
          <span class="label" id="rating-label">${strings.rating}</span><div class="stars" role="group" aria-labelledby="rating-label"></div>
          <label for="email">${strings.email}</label><input id="email" type="email" autocomplete="email" maxlength="254" aria-describedby="feedback-error">
          <p class="error" id="feedback-error" aria-live="polite"></p>
          <div class="actions"><button class="cancel" type="button">${strings.cancel}</button><button class="submit" type="submit">${strings.submit}</button></div>
        </form>
        <div class="success" role="status" tabindex="-1" hidden><div class="check" aria-hidden="true">✓</div><p>${strings.success}</p></div>
      </section>
    </div>`;
  const get = <T extends Element>(selector: string) => root.querySelector<T>(selector)!;
  const widget = get<HTMLElement>(".widget");
  widget.style.setProperty("--accent", config.accentColor && CSS.supports("color", config.accentColor) ? config.accentColor : "#0f172a");
  const title = config.title ?? strings.title;
  get("h2").textContent = title;
  const panel = get<HTMLElement>(".panel");
  panel.setAttribute("aria-label", title);
  const trigger = get<HTMLButtonElement>(".trigger");
  const form = get<HTMLFormElement>("form");
  const message = get<HTMLTextAreaElement>("textarea");
  const email = get<HTMLInputElement>("input");
  const error = get<HTMLElement>(".error");
  const submit = get<HTMLButtonElement>(".submit");
  const success = get<HTMLElement>(".success");
  let rating = 0;
  let controller: AbortController | undefined;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  const stars: HTMLButtonElement[] = [];
  const setRating = (value: number) => {
    rating = value;
    stars.forEach((star, index) => star.setAttribute("aria-pressed", String(index < value)));
  };
  for (let index = 0; index < 5; index++) {
    const star = document.createElement("button");
    star.type = "button";
    star.className = "star";
    star.textContent = "★";
    star.setAttribute("aria-label", `${index + 1} ${index === 0 ? strings.star : strings.stars}`);
    star.setAttribute("aria-pressed", "false");
    star.addEventListener("click", () => setRating(rating === index + 1 ? 0 : index + 1));
    star.addEventListener("keydown", (event) => {
      let next: number;
      if (event.key === "ArrowRight" || event.key === "ArrowUp") next = (index + 1) % 5;
      else if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = (index + 4) % 5;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = 4;
      else return;
      event.preventDefault();
      setRating(next + 1);
      stars[next]!.focus();
    });
    stars.push(star);
    get(".stars").append(star);
  }
  const close = () => {
    controller?.abort();
    controller = undefined;
    clearTimeout(closeTimer);
    panel.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    form.reset();
    setRating(0);
    error.textContent = "";
    message.removeAttribute("aria-invalid");
    email.removeAttribute("aria-invalid");
    form.hidden = false;
    success.hidden = true;
    submit.disabled = false;
    submit.textContent = strings.submit;
    trigger.focus();
  };
  trigger.addEventListener("click", () => {
    if (!panel.hidden) return close();
    panel.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    message.focus();
  });
  get(".close").addEventListener("click", close);
  get(".cancel").addEventListener("click", close);
  panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); }
    if (event.key !== "Tab") return;
    const focusable = Array.from(panel.querySelectorAll<HTMLElement>("button:not(:disabled),input,textarea,[tabindex='0']")).filter(el => !el.closest("[hidden]"));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (root.activeElement === first || root.activeElement === success)) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && (root.activeElement === last || root.activeElement === success)) { event.preventDefault(); first?.focus(); }
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (controller) return;
    const text = message.value.trim();
    const address = email.value.trim();
    message.removeAttribute("aria-invalid");
    email.removeAttribute("aria-invalid");
    if (!text || text.length > 5000) {
      error.textContent = !text ? strings.required : strings.length;
      message.setAttribute("aria-invalid", "true"); message.focus(); return;
    }
    if (address && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      error.textContent = strings.invalidEmail;
      email.setAttribute("aria-invalid", "true"); email.focus(); return;
    }
    error.textContent = "";
    submit.disabled = true;
    submit.textContent = strings.sending;
    const request = new AbortController();
    controller = request;
    const timeout = setTimeout(() => request.abort(), 10000);
    try {
      const response = await fetch(`${(config.apiUrl ?? window.location.origin).replace(/\/+$/, "")}/api/feedback`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-api-key": config.apiKey },
        credentials: "omit", signal: request.signal,
        body: JSON.stringify({ message: text, ...(address ? { email: address } : {}), ...(rating ? { rating } : {}) }),
      });
      if (controller !== request) return;
      if (!response.ok) {
        error.textContent = response.status === 401 ? strings.unauthorized : response.status === 429 ? strings.rateLimit : response.status === 400 ? strings.invalid : strings.generic;
        return;
      }
      form.hidden = true;
      success.hidden = false;
      success.focus();
      closeTimer = setTimeout(close, 2500);
    } catch {
      if (controller === request) error.textContent = strings.generic;
    } finally {
      clearTimeout(timeout);
      if (controller === request) {
        controller = undefined;
        submit.disabled = false;
        submit.textContent = strings.submit;
      }
    }
  });
  document.body.append(host);
}

export default init;

if (typeof document !== "undefined") {
  const current = document.currentScript;
  const script = current?.hasAttribute("data-api-key") ? current : document.querySelector("script[data-feedback-widget][data-api-key]");
  const apiKey = script?.getAttribute("data-api-key");
  if (apiKey) init({
    apiKey,
    apiUrl: script?.getAttribute("data-api-url") ?? undefined,
    position: script?.getAttribute("data-position") === "bottom-left" ? "bottom-left" : "bottom-right",
    accentColor: script?.getAttribute("data-accent-color") ?? undefined,
    title: script?.getAttribute("data-title") ?? undefined,
    locale: script?.getAttribute("data-locale") === "ru" ? "ru" : "en",
  });
}
