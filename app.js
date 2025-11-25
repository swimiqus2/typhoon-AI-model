// 태풍 6시간 뒤 풍속을 예측하는 간단한 규칙 기반 모델
// (Python에서 실험한 결정트리 아이디어를 브라우저용 if-else 규칙으로 옮긴 형태)

function getNumber(id) {
  const el = document.getElementById(id);
  if (!el) return NaN;
  const v = parseFloat(el.value);
  return isNaN(v) ? NaN : v;
}

function getWindUnit() {
  const radios = document.querySelectorAll('input[name="windUnit"]');
  for (const r of radios) {
    if (r.checked) return r.value; // "kt" or "ms"
  }
  return "kt";
}

function classifyStrength(ms) {
  // 아주 단순한 기준 (교육용)
  if (ms < 10) return "약한 열대저기압 수준";
  if (ms < 17) return "약한 태풍 (10–17 m/s)";
  if (ms < 33) return "중간 세기 태풍 (17–33 m/s)";
  return "강한 태풍 (33 m/s 이상)";
}

function predictWindMs(currentMs, pressure, lat, lon) {
  // 기본값: 현재 풍속을 그대로 가져가는 '지속성'에
  // 기압·위도에 따른 간단한 보정을 더한 규칙 모델
  let pred = currentMs;

  // 중심기압이 낮으면 (강한 태풍) 조금 더 강해질 가능성
  if (pressure < 950) {
    pred += 3;
  } else if (pressure > 1005) {
    pred -= 2;
  }

  // 위도가 높을수록 해수면 온도가 떨어져 세력이 약해지기 쉬움
  if (lat > 30) {
    pred -= 1.5;
  } else if (lat < 15) {
    pred += 0.5;
  }

  // 경도는 여기서는 약하게만 반영 (동쪽 쪽일 때 소폭 보정)
  if (lon > 140) {
    pred -= 0.5;
  }

  // 물리적으로 말이 안 되지 않도록 0 이하 방지
  if (pred < 0) pred = 0;

  return pred;
}

function format(value, digits = 1) {
  return value.toFixed(digits);
}

function onPredict() {
  const windInput = getNumber("windInput");
  const pressure = getNumber("pressureInput");
  const lat = getNumber("latInput");
  const lon = getNumber("lonInput");
  const unit = getWindUnit();

  const resultMain = document.getElementById("resultMain");
  const resultSub = document.getElementById("resultSub");
  const resultTag = document.getElementById("resultTag");
  const resultNote = document.getElementById("resultNote");

  // 입력값 체크
  if (isNaN(windInput) || isNaN(pressure) || isNaN(lat) || isNaN(lon)) {
    resultMain.textContent = "-.- m/s";
    resultSub.textContent = "모든 입력 칸에 숫자를 입력해 주세요.";
    resultTag.textContent = "태풍 세기: -";
    resultNote.innerHTML =
      '<span class="warn">입력이 비어 있거나 숫자가 아닙니다.</span> 풍속, 기압, 위도, 경도를 모두 다시 확인해 주세요.';
    return;
  }

  // 단위 변환: 사용자가 kt를 입력한 경우 → m/s로 변환
  let windMs;
  if (unit === "kt") {
    windMs = windInput * 0.514; // 1 kt ≈ 0.514 m/s
  } else {
    windMs = windInput;
  }

  const predMs = predictWindMs(windMs, pressure, lat, lon);
  const predKt = predMs / 0.514;

  const strength = classifyStrength(predMs);

  resultMain.textContent = `${format(predMs, 1)} m/s`;
  resultSub.textContent = `약 ${format(predKt, 1)} kt 수준으로 예측되었습니다.`;
  resultTag.textContent = `태풍 세기: ${strength}`;

  // 범위 체크
  const warnings = [];
  if (windInput < 0 || windInput > 120 && unit === "kt") {
    warnings.push("풍속이 권장 범위를 벗어났습니다.");
  }
  if (pressure < 880 || pressure > 1040) {
    warnings.push("중심기압이 권장 범위를 벗어났습니다.");
  }
  if (lat < 0 || lat > 60) {
    warnings.push("위도가 권장 범위를 벗어났습니다.");
  }
  if (lon < 100 || lon > 160) {
    warnings.push("경도가 권장 범위를 벗어났습니다.");
  }

  if (warnings.length > 0) {
    resultNote.innerHTML =
      '<span class="warn">입력값이 실제 태풍 통계에서 벗어날 수 있습니다.</span><br>' +
      warnings.join("<br>") +
      "<br>그럼에도 불구하고, 교육용 모델이 수학적 규칙에 따라 예측값을 계산한 결과입니다.";
  } else {
    resultNote.innerHTML =
      "기상청 태풍 통계 범위 안의 값으로 입력되었으며, " +
      "현재 풍속·기압·위도·경도 정보를 바탕으로 간단한 결정트리 형태 규칙 모델이 6시간 뒤 풍속을 예측했습니다.";
  }
}

function onReset() {
  ["windInput", "pressureInput", "latInput", "lonInput"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const resultMain = document.getElementById("resultMain");
  const resultSub = document.getElementById("resultSub");
  const resultTag = document.getElementById("resultTag");
  const resultNote = document.getElementById("resultNote");

  resultMain.textContent = "-.- m/s";
  resultSub.textContent = "아직 예측을 실행하지 않았습니다.";
  resultTag.textContent = "태풍 세기: -";
  resultNote.innerHTML =
    '현재 최대풍속, 중심기압, 위도·경도 정보를 바탕으로 간단한 결정트리 형태의 규칙 모델이 6시간 뒤 풍속을 예측합니다. ' +
    '이 값은 <span class="warn">실제 기상청 공식 예보가 아니라 교육용 탐구 모델</span>이라는 점에 유의해야 합니다.';
}

function onSample() {
  // 예시: 중간 세기 태풍 정도
  const windInput = document.getElementById("windInput");
  const pressureInput = document.getElementById("pressureInput");
  const latInput = document.getElementById("latInput");
  const lonInput = document.getElementById("lonInput");

  if (windInput) windInput.value = 80; // kt 기준
  if (pressureInput) pressureInput.value = 950;
  if (latInput) latInput.value = 25;
  if (lonInput) lonInput.value = 130;

  // 단위는 kt로 맞춰두기
  const radios = document.querySelectorAll('input[name="windUnit"]');
  radios.forEach((r) => {
    if (r.value === "kt") r.checked = true;
  });
}

// 이벤트 바인딩
document.addEventListener("DOMContentLoaded", () => {
  const predictBtn = document.getElementById("predictBtn");
  const resetBtn = document.getElementById("resetBtn");
  const sampleBtn = document.getElementById("sampleBtn");

  if (predictBtn) predictBtn.addEventListener("click", onPredict);
  if (resetBtn) resetBtn.addEventListener("click", onReset);
  if (sampleBtn) sampleBtn.addEventListener("click", onSample);
});
