/**
 * tools/scrape_limits.js
 * 실행: node tools/scrape_limits.js
 *
 * 준비:
 * 1) npm init -y
 * 2) npm i axios cheerio
 *
 * 결과:
 * /limits.json 생성
 */

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");

// ✅ 여기에 네 benefitData의 id 목록을 넣어도 되고,
// script.js에서 자동 추출해도 됨. 아래는 script.js에서 자동 추출 방식.
const SCRIPT_PATH = path.join(__dirname, "..", "script.js");
const OUT_PATH = path.join(__dirname, "..", "limits.json");

// --- 유틸: script.js에서 benefitData id 추출(간단 파싱) ---
function extractIdsFromScriptJs(scriptText) {
    // 매우 단순한 방식: "id": 숫자 를 모두 찾아 unique
    const re = /"id"\s*:\s*(\d+)/g;
    const ids = new Set();
    let m;
    while ((m = re.exec(scriptText)) !== null) {
        ids.add(m[1]);
    }
    return Array.from(ids);
}

// --- 유틸: HTML -> 텍스트 라인 ---
function htmlToLines(html) {
    const $ = cheerio.load(html);
    const text = $.text();
    return text
        .split("\n")
        .map(s => s.trim())
        .filter(Boolean);
}

// --- 유틸: 구간 슬라이스 (헤딩/섹션 기반) ---
function sliceBetween(lines, startRe, endRe) {
    const s = lines.findIndex(l => startRe.test(l));
    if (s === -1) return [];
    const e = lines.findIndex((l, i) => i > s && endRe.test(l));
    return lines.slice(s, e === -1 ? lines.length : e);
}

// --- CGV/메가박스 제거(롯데시네마는 살림) ---
function sanitize(line) {
    let out = line;
    out = out.replace(/\bCGV\b\s*[·,/|]\s*/gi, "");
    out = out.replace(/\b메가박스\b\s*[·,/|]\s*/gi, "");
    out = out.replace(/\bCGV\b/gi, "");
    out = out.replace(/\b메가박스\b/gi, "");
    out = out.replace(/\s+/g, " ").trim();
    out = out.replace(/^·\s*|·\s*$/g, "").trim();
    return out;
}

// --- 제한사항 판별(원하는 패턴 추가/삭제 가능) ---
const LIMIT_RE = /(전월\s*실적|실적\s*조건|이용\s*조건|조건\s*충족|실적\s*제외|통합할인한도|할인한도|적립한도|한도|최대|횟수|건당|회당|1회|1건|1일|일\s*\d+\s*회|하루\s*\d+\s*회|월\s*\d+\s*(회|건|번)|연\s*\d+\s*(회|만원)|연간|기간|제외|제외\s*대상|무이자\s*할부|무이자할부|간편결제\s*제외|상품권|선불|충전|취소|환불)/;

function pickLimitLines(poolLines) {
    const seen = new Set();
    const out = [];

    for (const raw of poolLines) {
        const line = sanitize(raw);
        if (!line) continue;

        if (!LIMIT_RE.test(line)) continue;
        if (line.length < 6) continue;

        if (!seen.has(line)) {
            seen.add(line);
            out.push(line);
        }
    }
    return out;
}

async function fetchDetail(cardAdId) {
    const url = `https://card-search.naver.com/item?cardAdId=${encodeURIComponent(cardAdId)}`;
    const { data: html } = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 15000,
    });
    return { url, html };
}

async function main() {
    const scriptText = fs.readFileSync(SCRIPT_PATH, "utf-8");
    const ids = extractIdsFromScriptJs(scriptText);

    if (!ids.length) {
        console.error("script.js에서 id를 찾지 못했습니다. SCRIPT_PATH 확인:", SCRIPT_PATH);
        process.exit(1);
    }

    console.log("총 카드 id 개수:", ids.length);

    const results = {};
    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        console.log(`[${i + 1}/${ids.length}] cardAdId=${id} ...`);

        try {
            const { url, html } = await fetchDetail(id);
            const text = normalizeTextFromHtml(html);
            const limits = extractLimitSentences(text);
            results[id] = { sourceUrl: url, limits };
        } catch (e) {
            results[id] = { error: String(e?.message || e), limits: [] };
        }

        // 너무 빨리 요청하면 차단될 수 있어서 쉬기
        await new Promise(r => setTimeout(r, 300));
    }


    fs.writeFileSync(OUT_PATH, JSON.stringify(results, null, 2), "utf-8");
    console.log("완료! 생성 파일:", OUT_PATH);
}
function normalizeTextFromHtml(html) {
    // 줄바꿈 강제 삽입(텍스트 뭉개짐 방지)
    const withBreaks = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|li|h\d)>/gi, "\n");

    const $ = cheerio.load(withBreaks);
    const text = $.text();

    return text
        .replace(/\u00A0/g, " ")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{2,}/g, "\n")
        .trim();
}

function extractLimitSentences(text) {
    // 문장/조각 분리: 줄바꿈 + 마침표/괄호 기준으로 쪼갬
    const parts = text
        .split(/\n|[.。]|(?<=\))\s+|(?<=다)\s+/)
        .map(s => s.trim())
        .filter(Boolean);

    const limitRe = /(전월\s*실적|실적\s*조건|이용\s*조건|통합.*한도|할인한도|적립한도|한도|최대|횟수|건당|회당|1일|일\s*\d+\s*회|하루\s*\d+\s*회|월\s*\d+\s*(회|건|번)|연\s*\d+\s*(회|만원)|연간|제외|제외\s*대상|무이자\s*할부|무이자할부|상품권|선불|충전|취소|환불)/;

    const seen = new Set();
    const out = [];

    for (let s of parts) {
        // CGV/메가박스 제거(원하면)
        s = s
            .replace(/\bCGV\b\s*[·,/|]\s*/gi, "")
            .replace(/\b메가박스\b\s*[·,/|]\s*/gi, "")
            .replace(/\bCGV\b/gi, "")
            .replace(/\b메가박스\b/gi, "")
            .replace(/\s+/g, " ")
            .trim();

        if (!s) continue;
        if (s.length < 8) continue;
        if (!limitRe.test(s)) continue;

        if (!seen.has(s)) {
            seen.add(s);
            out.push(s);
        }
    }

    return out;
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
