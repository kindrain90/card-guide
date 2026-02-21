// 주요 카드들의 전월실적 조건
// 카드사 홈페이지나 약관에서 확인한 정보를 수동으로 입력
// null = 전월실적 조건 없음 또는 미확인

const monthlyRequirements = {
    // 롯데카드
    10304: null, // 디지로카 London - 실적 없음
    10105: null, // LOCA LIKIT 1.2 - 실적 없음
    10108: "전월 30만원 이상", // LOCA LIKIT Play - 예시 (확인 필요)
    10071: "전월 30만원 이상", // LOCA LIKIT - 예시 (확인 필요)

    // 삼성카드
    10157: "전월 30만원 이상", // 삼성 iD SIMPLE - 예시 (확인 필요)
    1530: "전월 30만원 이상", // 삼성카드 taptap O - 예시 (확인 필요)
    1531: "전월 30만원 이상", // 삼성카드 taptap S - 예시 (확인 필요)

    // KB국민카드
    10216: "전월 30만원 이상", // KB국민 My WE:SH - 예시 (확인 필요)
    2332: "전월 30만원 이상", // KB국민 톡톡Pay - 예시 (확인 필요)

    // 우리카드
    10344: null, // D4카드의정석Ⅱ - 실적 없음
    10492: null, // 카드의정석2 - 실적 없음

    // 현대카드
    10323: null, // 현대카드ZERO Edition3(포인트형) - 실적 없음
    10334: null, // 현대카드M - 실적 없음
    10322: null, // 현대카드ZERO Edition3(할인형) - 실적 없음

    // 신한카드
    10490: "전월 30만원 이상", // 신한카드 Discount Plan - 예시 (확인 필요)
    2337: "전월 30만원 이상", // 신한카드 Deep Oil - 예시 (확인 필요)
    1570: "전월 30만원 이상", // 신한카드 YOLOⓘ - 예시 (확인 필요)

    // NH농협카드
    3996: "전월 30만원 이상", // 올바른FLEX카드 - 예시 (확인 필요)

    // 하나카드
    10493: "전월 30만원 이상", // CLUB SK - 예시 (확인 필요)
    2349: "전월 30만원 이상", // Mile 1.6 대한항공 - 예시 (확인 필요)
};

// 전월실적 정보를 카드 데이터에 병합하는 함수
function mergeMonthlyRequirements(cards) {
    return cards.map(card => ({
        ...card,
        monthlyRequirement: monthlyRequirements[card.id] || null
    }));
}

// Node.js 환경에서 사용
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { monthlyRequirements, mergeMonthlyRequirements };
}
