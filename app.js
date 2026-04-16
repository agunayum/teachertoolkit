const elements = {
    wordInput: document.getElementById("wordInput"),
    gameTitle: document.getElementById("gameTitle"),
    groupSize: document.getElementById("groupSize"),
    roundCount: document.getElementById("roundCount"),
    studentPrompt: document.getElementById("studentPrompt"),
    allowReuse: document.getElementById("allowReuse"),
    shuffleWords: document.getElementById("shuffleWords"),
    generateButton: document.getElementById("generateButton"),
    shuffleButton: document.getElementById("shuffleButton"),
    printButton: document.getElementById("printButton"),
    answerToggle: document.getElementById("answerToggle"),
    wordCount: document.getElementById("wordCount"),
    possibleRounds: document.getElementById("possibleRounds"),
    teacherTip: document.getElementById("teacherTip"),
    boardTitle: document.getElementById("boardTitle"),
    boardPrompt: document.getElementById("boardPrompt"),
    emptyState: document.getElementById("emptyState"),
    roundsContainer: document.getElementById("roundsContainer"),
    roundTemplate: document.getElementById("roundTemplate")
};

const storageKey = "odd-one-out-builder-state";

const teacherTips = [
    "Use one-sentence explanations.",
    "Accept more than one answer if the reason is strong.",
    "Start with obvious sets before trickier ones.",
    "Let students say: '___ is the odd one out because...'",
    "Reuse the same words in new combinations to test depth."
];

const state = {
    showTeacherNotes: false,
    rounds: []
};

function parseWords(rawInput) {
    return rawInput
        .split(/[\n,;]+|\s{2,}/)
        .map((word) => word.trim())
        .filter(Boolean);
}

function uniqueWords(words) {
    return [...new Set(words.map((word) => word.trim()).filter(Boolean))];
}

function shuffle(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function saveState() {
    const persisted = {
        wordInput: elements.wordInput.value,
        gameTitle: elements.gameTitle.value,
        groupSize: elements.groupSize.value,
        roundCount: elements.roundCount.value,
        studentPrompt: elements.studentPrompt.value,
        allowReuse: elements.allowReuse.checked,
        shuffleWords: elements.shuffleWords.checked
    };

    localStorage.setItem(storageKey, JSON.stringify(persisted));
}

function loadState() {
    const saved = localStorage.getItem(storageKey);
    if (!saved) {
        elements.wordInput.value = "happy\nexcited\ntable\nrun\njump\nsleepy\napple\nbanana\nangry\nteacher\ndoctor\npurple\nwhisper\nshout\norange\ncold\nhot\nsandwich\nfurious\ndelighted";
        return;
    }

    try {
        const parsed = JSON.parse(saved);
        elements.wordInput.value = parsed.wordInput || "";
        elements.gameTitle.value = parsed.gameTitle || "Odd One Out";
        elements.groupSize.value = parsed.groupSize || "3";
        elements.roundCount.value = parsed.roundCount || "8";
        elements.studentPrompt.value = parsed.studentPrompt || "Which word is the odd one out, and why?";
        elements.allowReuse.checked = parsed.allowReuse !== false;
        elements.shuffleWords.checked = parsed.shuffleWords !== false;
    } catch (_error) {
        elements.wordInput.value = "";
    }
}

function countPossibleRounds(totalWords, groupSize, allowReuse) {
    if (totalWords < groupSize) {
        return 0;
    }

    if (allowReuse) {
        return Math.max(0, Math.floor(totalWords * 1.5));
    }

    return Math.floor(totalWords / groupSize);
}

function buildTeacherNote(group) {
    const sampleOddWord = group[group.length - 1];
    const comparisonWords = group.slice(0, group.length - 1).join(", ");
    return `Possible note: <strong>${sampleOddWord}</strong> could be the odd one out if students group <strong>${comparisonWords}</strong> together. Another valid answer is fine if the explanation makes sense.`;
}

function generateRounds() {
    const parsed = uniqueWords(parseWords(elements.wordInput.value));
    const groupSize = Number(elements.groupSize.value);
    const requestedRounds = Math.max(1, Number(elements.roundCount.value) || 1);
    const allowReuse = elements.allowReuse.checked;
    const shouldShuffleInsideRound = elements.shuffleWords.checked;

    elements.wordCount.textContent = String(parsed.length);
    elements.possibleRounds.textContent = String(countPossibleRounds(parsed.length, groupSize, allowReuse));
    elements.teacherTip.textContent = teacherTips[Math.floor(Math.random() * teacherTips.length)];
    elements.boardTitle.textContent = elements.gameTitle.value.trim() || "Odd One Out";
    elements.boardPrompt.textContent = elements.studentPrompt.value.trim() || "Which word is the odd one out, and why?";

    if (parsed.length < groupSize) {
        state.rounds = [];
        renderRounds();
        saveState();
        return;
    }

    let rounds = [];

    if (allowReuse) {
        for (let roundIndex = 0; roundIndex < requestedRounds; roundIndex += 1) {
            const chosen = shuffle(parsed).slice(0, groupSize);
            rounds.push({
                words: shouldShuffleInsideRound ? shuffle(chosen) : chosen,
                note: buildTeacherNote(chosen)
            });
        }
    } else {
        const pool = shuffle(parsed);
        const maxRounds = Math.min(requestedRounds, Math.floor(pool.length / groupSize));

        for (let roundIndex = 0; roundIndex < maxRounds; roundIndex += 1) {
            const chunk = pool.slice(roundIndex * groupSize, roundIndex * groupSize + groupSize);
            rounds.push({
                words: shouldShuffleInsideRound ? shuffle(chunk) : chunk,
                note: buildTeacherNote(chunk)
            });
        }
    }

    state.rounds = rounds;
    renderRounds();
    saveState();
}

function renderRounds() {
    elements.roundsContainer.innerHTML = "";
    const hasRounds = state.rounds.length > 0;
    elements.emptyState.hidden = hasRounds;

    if (!hasRounds) {
        return;
    }

    state.rounds.forEach((round, index) => {
        const fragment = elements.roundTemplate.content.cloneNode(true);
        const card = fragment.querySelector(".round-card");
        const number = fragment.querySelector(".round-number");
        const chips = fragment.querySelector(".chips");
        const note = fragment.querySelector(".teacher-note");

        number.textContent = `Round ${index + 1}`;

        round.words.forEach((word) => {
            const chip = document.createElement("span");
            chip.className = "chip";
            chip.textContent = word;
            chips.appendChild(chip);
        });

        note.innerHTML = round.note;
        note.hidden = !state.showTeacherNotes;

        if (state.showTeacherNotes) {
            card.classList.add("showing-note");
        }

        elements.roundsContainer.appendChild(fragment);
    });
}

function toggleTeacherNotes() {
    state.showTeacherNotes = !state.showTeacherNotes;
    elements.answerToggle.textContent = state.showTeacherNotes ? "Hide Teacher Notes" : "Show Teacher Notes";
    elements.answerToggle.setAttribute("aria-pressed", String(state.showTeacherNotes));
    renderRounds();
}

function bindEvents() {
    [
        elements.wordInput,
        elements.gameTitle,
        elements.groupSize,
        elements.roundCount,
        elements.studentPrompt,
        elements.allowReuse,
        elements.shuffleWords
    ].forEach((element) => {
        element.addEventListener("input", saveState);
        element.addEventListener("change", saveState);
    });

    elements.generateButton.addEventListener("click", generateRounds);
    elements.shuffleButton.addEventListener("click", generateRounds);
    elements.printButton.addEventListener("click", () => window.print());
    elements.answerToggle.addEventListener("click", toggleTeacherNotes);
}

loadState();
bindEvents();
generateRounds();
