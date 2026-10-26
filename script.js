const VIDEO = {
  vertical: "video-1.mp4",
  horizontal: "video-2.mp4",
};

const RATES = {
  sedan: { ppf: 140000, vinyl: 160000, ceramic: 35000 },
  crossover: { ppf: 175000, vinyl: 210000, ceramic: 48000 },
  suv: { ppf: 230000, vinyl: 280000, ceramic: 65000 },
};

const CAR_LABEL = {
  sedan: "Седан / Купе",
  crossover: "Кроссовер",
  suv: "Тяжёлый внедорожник",
};

const TASK_LABEL = {
  ppf: "Защитная плёнка",
  vinyl: "Цветной винил",
  ceramic: "Полировка + керамика",
};

const money = new Intl.NumberFormat("ru-RU");

document.documentElement.classList.add("js");

initHeroVideo();
initHeader();
initScrollProgress();
initReveal();
initQuiz();
initLightbox();
initYear();

function isSmartphone() {
  const ua = navigator.userAgent || "";
  const phoneUA = /iPhone|iPod|Android.+Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const narrow = window.matchMedia("(max-width: 767px)").matches;
  return phoneUA || narrow;
}

function initHeroVideo() {
  const video = document.querySelector("#heroVideo");
  if (!video) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const narrowQuery = window.matchMedia("(max-width: 767px)");

  const mount = async () => {
    const vertical = isSmartphone();
    const file = vertical ? VIDEO.vertical : VIDEO.horizontal;
    const src = encodeURI(file);
    document.body.dataset.video = vertical ? "vertical" : "horizontal";

    if (video.dataset.src === src) {
      if (!reduced && video.paused) video.play().catch(() => {});
      return;
    }

    video.dataset.src = src;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.loop = true;
    video.src = src;

    if (reduced) {
      video.pause();
      video.removeAttribute("autoplay");
      return;
    }

    try {
      await video.play();
    } catch {
      video.poster = video.poster;
    }
  };

  mount();
  narrowQuery.addEventListener("change", mount);

  document.addEventListener("visibilitychange", () => {
    if (!video.src || reduced) return;
    if (document.hidden) video.pause();
    else video.play().catch(() => {});
  });
}

function initHeader() {
  const header = document.querySelector(".header");
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  onScroll();
  document.addEventListener("scroll", onScroll, { passive: true });
}

function initScrollProgress() {
  const bar = document.querySelector(".scroll-progress");
  if (!bar) return;

  const onScroll = () => {
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const progress = height > 0 ? (window.scrollY / height) * 100 : 0;
    bar.style.width = `${progress}%`;
  };

  onScroll();
  document.addEventListener("scroll", onScroll, { passive: true });
}

function initReveal() {
  const nodes = document.querySelectorAll(".reveal");
  if (!nodes.length || !("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("is-in"));
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    nodes.forEach((node) => node.classList.add("is-in"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
  );

  nodes.forEach((node) => observer.observe(node));
}

function initYear() {
  const year = String(new Date().getFullYear());
  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = year;
  });
}

function checkedValue(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value || "";
}

function validContact(value) {
  const text = value.trim();
  const digits = text.replace(/\D/g, "");
  if (digits.length >= 10 && digits.length <= 15) return true;
  if (/^@?[a-zA-Z0-9_]{4,32}$/.test(text)) return true;
  if (/t\.me\//i.test(text)) return true;
  return false;
}

function estimateFor(car, task) {
  const amount = RATES[car]?.[task];
  if (!amount) return "";
  return `от ${money.format(amount)} ₽`;
}

let lockedScroll = 0;

function lockPage() {
  lockedScroll = window.scrollY;
  document.body.classList.add("is-locked");
  document.body.style.top = `-${lockedScroll}px`;
  document.querySelector("main")?.setAttribute("inert", "");
  document.querySelector(".header")?.setAttribute("inert", "");
  document.querySelector(".footer")?.setAttribute("inert", "");
}

function unlockPage() {
  if (!document.body.classList.contains("is-locked")) return;
  document.body.classList.remove("is-locked");
  document.body.style.top = "";
  document.querySelector("main")?.removeAttribute("inert");
  document.querySelector(".header")?.removeAttribute("inert");
  document.querySelector(".footer")?.removeAttribute("inert");
  window.scrollTo(0, lockedScroll);
}

function initQuiz() {
  const root = document.querySelector("#quiz");
  const form = document.querySelector("#quizForm");
  const dialog = root?.querySelector(".quiz__dialog");
  const success = document.querySelector("#quizSuccess");
  const title = document.querySelector("#quizTitle");
  const contact = document.querySelector("#quizContact");
  const error = document.querySelector("#quizError");
  const estimate = document.querySelector("#quizEstimate");
  const summary = document.querySelector("#quizSummary");
  const stepNum = document.querySelector("#quizStepNum");
  if (!root || !form || !dialog) return;

  const titles = {
    1: "Какой у вас автомобиль?",
    2: "Какая задача?",
    3: "Куда прислать смету?",
  };

  let step = 1;
  let lastFocus = null;

  const syncNext = (name) => {
    const fieldset = form.querySelector(`[data-step="${name === "car" ? 1 : 2}"]`);
    const next = fieldset?.querySelector("[data-next]");
    if (next) next.disabled = !checkedValue(name);
  };

  const paintProgress = () => {
    root.querySelectorAll("[data-progress]").forEach((bar) => {
      bar.classList.toggle("is-on", Number(bar.dataset.progress) <= step);
    });
    if (stepNum) stepNum.textContent = String(step);
  };

  const showStep = (nextStep) => {
    step = nextStep;
    form.hidden = false;
    success.hidden = true;
    title.hidden = false;
    title.textContent = titles[step];
    dialog.setAttribute("aria-labelledby", "quizTitle");
    form.querySelectorAll("[data-step]").forEach((panel) => {
      panel.hidden = Number(panel.dataset.step) !== step;
    });
    paintProgress();

    if (step === 3) {
      const price = estimateFor(checkedValue("car"), checkedValue("task"));
      estimate.textContent = price ? `Ориентир ${price}` : "";
    }

    title.focus({ preventScroll: true });
  };

  const open = (presetTask) => {
    if (presetTask && TASK_LABEL[presetTask]) {
      const input = form.querySelector(`input[name="task"][value="${presetTask}"]`);
      if (input) input.checked = true;
    }
    syncNext("car");
    syncNext("task");
    const start = !checkedValue("car") ? 1 : !checkedValue("task") ? 2 : 3;
    lastFocus = document.activeElement;
    root.hidden = false;
    lockPage();
    showStep(start);
  };

  const close = () => {
    root.hidden = true;
    unlockPage();
    if (!success.hidden) reset();
    lastFocus?.focus?.();
  };

  const reset = () => {
    form.reset();
    error.hidden = true;
    success.hidden = true;
    form.hidden = false;
    title.hidden = false;
    const copy = document.querySelector("#quizCopy");
    if (copy) copy.textContent = "Скопировать";
    syncNext("car");
    syncNext("task");
    showStep(1);
  };

  document.querySelectorAll("[data-open-quiz]").forEach((button) => {
    button.addEventListener("click", () => open(button.dataset.task || ""));
  });

  root.querySelectorAll("[data-close-quiz]").forEach((button) => {
    button.addEventListener("click", close);
  });

  form.querySelectorAll('input[name="car"]').forEach((input) => {
    input.addEventListener("change", () => {
      syncNext("car");
      window.setTimeout(() => showStep(2), 180);
    });
  });

  form.querySelectorAll('input[name="task"]').forEach((input) => {
    input.addEventListener("change", () => {
      syncNext("task");
      window.setTimeout(() => showStep(3), 180);
    });
  });

  form.querySelectorAll("[data-next]").forEach((button) => {
    button.addEventListener("click", () => {
      if (step === 1 && checkedValue("car")) showStep(2);
      else if (step === 2 && checkedValue("task")) showStep(3);
    });
  });

  form.querySelectorAll("[data-back]").forEach((button) => {
    button.addEventListener("click", () => showStep(Math.max(1, step - 1)));
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = contact.value;
    if (!validContact(value)) {
      error.hidden = false;
      contact.focus();
      return;
    }
    error.hidden = true;

    const car = checkedValue("car");
    const task = checkedValue("task");
    const price = estimateFor(car, task);
    const sheet = [
      "BROTHERS-STYLE / СМЕТА",
      `Класс: ${CAR_LABEL[car] || "—"}`,
      `Задача: ${TASK_LABEL[task] || "—"}`,
      `Ориентир: ${price || "—"}`,
      `Контакт: ${value.trim()}`,
      "Статус: ждёт технолога",
    ].join("\n");

    summary.textContent = sheet;
    form.hidden = true;
    title.hidden = true;
    success.hidden = false;
    dialog.setAttribute("aria-labelledby", "quizDoneTitle");
    paintProgress();
    document.querySelector("#quizCopy")?.focus();
  });

  contact?.addEventListener("input", () => {
    if (validContact(contact.value)) error.hidden = true;
  });

  document.querySelector("#quizCopy")?.addEventListener("click", async () => {
    const text = summary.textContent || "";
    try {
      await navigator.clipboard.writeText(text);
      document.querySelector("#quizCopy").textContent = "Скопировано";
    } catch {
      document.querySelector("#quizCopy").textContent = "Выделите текст выше";
    }
  });

  document.querySelector("#quizRestart")?.addEventListener("click", reset);

  document.addEventListener("keydown", (event) => {
    if (root.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;

    const nodes = [...dialog.querySelectorAll("a, button, input")].filter((node) => {
      if (node.disabled) return false;
      if (node.closest("[hidden]")) return false;
      return node.getClientRects().length > 0;
    });
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  syncNext("car");
  syncNext("task");
}

function initLightbox() {
  const root = document.querySelector("#lightbox");
  const image = document.querySelector("#lightboxImage");
  const caption = document.querySelector("#lightboxCaption");
  if (!root || !image) return;

  let lastFocus = null;
  const quiz = document.querySelector("#quiz");

  const close = () => {
    root.hidden = true;
    image.removeAttribute("src");
    if (quiz?.hidden) unlockPage();
    lastFocus?.focus?.();
  };

  document.querySelectorAll(".shot__open").forEach((button) => {
    button.addEventListener("click", () => {
      const source = button.dataset.full;
      if (!source) return;
      image.src = encodeURI(source);
      image.alt = button.dataset.caption || "";
      caption.textContent = button.dataset.caption || "";
      lastFocus = document.activeElement;
      root.hidden = false;
      if (!document.body.classList.contains("is-locked")) lockPage();
      root.querySelector(".lightbox__close")?.focus();
    });
  });

  root.querySelectorAll("[data-close-light]").forEach((button) => {
    button.addEventListener("click", close);
  });

  document.addEventListener("keydown", (event) => {
    if (root.hidden || event.key !== "Escape") return;
    if (quiz && !quiz.hidden) return;
    event.preventDefault();
    close();
  });
}
