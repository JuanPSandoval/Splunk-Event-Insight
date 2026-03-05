let eventsData = {};

async function loadEventsData() {
    const url = chrome.runtime.getURL("events.json");
    const response = await fetch(url);
    eventsData = await response.json();
}

function getRiskClass(risk) {
    switch (risk) {
        case "High":
            return "risk-high";
        case "Medium":
            return "risk-medium";
        case "Low":
            return "risk-low";
        default:
            return "risk-unknown";
    }
}

function attachTooltipToSpan(valueSpan, eventCode) {
    let tooltip = null;
    valueSpan.addEventListener("mouseenter", function () {
        const eventInfo = eventsData[eventCode];
        tooltip = document.createElement("div");
        tooltip.classList.add("splunk-tooltip");

        if (eventInfo) {
            const tactics = eventInfo.attack_tactics.join(", ");
            tooltip.innerHTML = `
                <div class="tooltip-title">
                    ${eventCode} - ${eventInfo.title}
                </div>

                <div class="tooltip-section">
                    <span class="label">Base Risk:</span>
                    <span class="${getRiskClass(eventInfo.base_risk)}">
                        ${eventInfo.base_risk}
                    </span>
                    <span class="severity-score">
                        (${eventInfo.severity_score}/100)
                    </span>
                </div>

                <div class="tooltip-section">
                    <span class="label">Attack Tactics:</span>
                    ${tactics}
                </div>

                <div class="tooltip-section">
                    <span class="label">Common Abuse:</span>
                    ${eventInfo.common_abuse}
                </div>

                <div class="tooltip-section">
                    <span class="label">SOC Notes:</span>
                    ${eventInfo.soc_notes}
                </div>

                <div class="tooltip-section">
                    <span class="label">Recommendation:</span>
                    ${eventInfo.recommendation}
                </div>
            `;
        } else {
            tooltip.textContent = "No intelligence available for this EventCode.";
        }
        document.body.appendChild(tooltip);
        const rect = valueSpan.getBoundingClientRect();
        tooltip.style.top = rect.bottom + window.scrollY + 8 + "px";
        tooltip.style.left = rect.left + window.scrollX + "px";
    });

    valueSpan.addEventListener("mouseleave", function () {
        if (tooltip) {
            tooltip.remove();
            tooltip = null;
        }
    });
}
function processEventCodes() {
    const containers = document.querySelectorAll("span.t");
    containers.forEach(container => {
        const children = container.querySelectorAll(":scope > span")
        if (children.length === 2) {
            const keySpan = children[0];
            const valueSpan = children[1];
            if (keySpan.textContent.trim() === "EventCode") {
                if (!valueSpan.dataset.tooltipAttached) {
                    const eventCode = valueSpan.textContent.trim();
                    attachTooltipToSpan(valueSpan, eventCode);
                    valueSpan.dataset.tooltipAttached = "true";
                }
            }
        }
    });
}
async function init() {
    await loadEventsData();
    processEventCodes();
    const observer = new MutationObserver(() => {
        processEventCodes();
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}
init();