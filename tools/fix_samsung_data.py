import json

# 사용자로부터 받은 삼성 iD SIMPLE (10157) 상세 정보
samsung_id_simple_limits = [
    "영화 3,000원 할인",
    "전월 이용금액 30만원 이상 시 제공",
    "영화 티켓 건별 10,000원 이상 결제 시 3,000원 결제일할인",
    "할인대상 : CGV, 롯데시네마, 메가박스",
    "통합 월 1회 제공",
    "전월 이용금액 30만원 이상 시 제공",
    "발급월+1개월까지는 전월 이용금액 30만원 미만 시에도 제공",
    "오프라인 결제 및 공식홈페이지 ·앱을 통한 결제건에 한함"
]

def deduplicate_limits(filename):
    # 중복 키 문제를 해결하기 위해 텍스트로 읽어서 직접 파싱하거나,
    # python의 json.load는 마지막 키를 유지하므로, 
    # 여러번 읽어서 데이터를 합치는 방식으로 접근
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # 간단한 중복 키 처리를 위해 객체들을 리스트로 추출하려 했으나
    # 파일 구조가 { "id": {...}, "id": {...} } 이므로 
    # 정규식이나 수동 파싱이 필요함.
    # 하지만 여기서는 이미 ConvertFrom-Json -> ConvertTo-Json 을 거치며 
    # "마지막 키가 살아남은 상태"임. (Step 316 참고)
    
    # 따라서 현재 limits.json 에는 중복 키가 '논리적'으로는 없을 것이나 (파일상엔 있을 수도 있음)
    # 일단 현재 상태에서 데이터를 불러와서 10157을 강제로 업데이트함.
    
    try:
        data = json.loads(content)
    except Exception as e:
        print(f"Error parsing JSON: {e}")
        return

    # 10157 업데이트
    if "10157" in data:
        data["10157"]["limits"] = samsung_id_simple_limits
        print("Updated 10157 with provided movie limits.")
    else:
        data["10157"] = {
            "sourceUrl": "https://www.samsungcard.com/home/card/cardinfo/do?code=EPC0001",
            "limits": samsung_id_simple_limits
        }
        print("Created 10157 with provided movie limits.")

    # 파일 저장 (Clean JSON)
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    # limits_data.js 도 함께 갱신
    with open('limits_data.js', 'w', encoding='utf-8') as f:
        f.write('var limits_data = ' + json.dumps(data, ensure_ascii=False, indent=2) + ';')
    
    print("limits.json and limits_data.js updated successfully.")

if __name__ == "__main__":
    deduplicate_limits('limits.json')
