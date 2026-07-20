// 태풍 6시간 뒤 풍속 예측 V2
// V1: 현재 최대풍속, 중심기압, 위도, 경도 기반 기존 규칙 모델
// V2: V1에 해상·연안·육지 위치 조건을 추가 반영한 비교 모델
// 목적: 위치 조건이 예측 성능 개선 변수인지, 오차 진단 기준인지 확인하기 위한 탐구용 수정

function getNumber(id) {
  const el = document.getElementById(id);
  if (!el) return NaN;
  const v = parseFloat(el.value);
  return isNaN(v) ? NaN : v;
}

function getWindUnit() {
  const radios = document.querySelectorAll('input[name="windUnit"]');
  for (const r of radios) {
    if (r.checked) return r.value;
  }
  return "kt";
}

function classifyStrength(ms) {
  if (ms < 10) return "약한 열대저기압 수준";
  if (ms < 17) return "약한 태풍 (10–17 m/s)";
  if (ms < 33) return "중간 세기 태풍 (17–33 m/s)";
  return "강한 태풍 (33 m/s 이상)";
}

// 위도·경도를 바탕으로 한 탐구용 간단 분류
// 실제 지형 자료를 사용한 정밀 분류가 아니라, 조건 비교를 위한 보조 기준임
function classifyLocation(lat, lon) {
  if (lat >= 33 && lon >= 124 && lon <= 132) {
    return "land";
  } else if (lat >= 27 && lat < 33 && lon >= 122 && lon <= 135) {
    return "coast";
  } else {
    return "sea";
  }
}

function locationLabel(type) {
  if (type === "sea") return "해상";
  if (type === "coast") return "연안";
  if (type === "land") return "육지";
  return "미분류";
}

// V1: 기존 방식
// 현재 풍속, 중심기압, 위도, 경도만 반영
function predictWindV1(currentMs, pressure, lat, lon) {
  let pred = currentMs;

  // 중심기압이 낮을수록 태풍 세력이 강할 가능성이 있어 보정
  if (pressure < 950) {
    pred += 3;
  } else if (pressure > 1005) {
    pred -= 2;
  }

  // 위도가 높아질수록 해수면 온도 조건이 달라질 수 있어 보정
  if (lat > 30) {
    pred -= 1.5;
  } else if (lat < 15) {
    pred += 0.5;
  }

  // 경도는 약한 위치 보정으로만 반영
  if (lon > 140) {
    pred -= 0.5;
  }

  if (pred < 0) pred = 0;
  return pred;
}

// V2: 위치 조건 반영 방식
// 해상·연안·육지 조건에 따라 V1 예측값을 보정
function predictWindV2(currentMs, pressure, lat, lon, locationType) {
  let pred = predictWindV1(currentMs, pressure, lat, lon);

  if (locationType === "sea") {
    // 해상: 수증기 공급과 해양 조건으로 세력이 유지될 가능성 반영
    if (pressure < 970) {
      pred += 1.2;
    } else {
      pred += 0.5;
    }
  } else if (locationType === "coast") {
    // 연안: 해양과 육지 조건이 함께 작용하는 전이 구간으로 처리
    pred -= 0.3;
    if (currentMs >= 33) {
      pred -= 0.7;
    }
  } else if (locationType === "land") {
    // 육지: 지표 마찰과 수증기 공급 감소로 약화 가능성 반영
    pred -= 2.0;
    if (currentMs >= 25) {
      pred -= 1.0;
    }
  }

  if (pred < 0) pred = 0;
  return pred;
}

function format(value, digits = 1) {
  return value.toFixed(digits);
}

function buildDiagnosis(v1, v2, locationType) {
  const diff = v2 - v1;
  const absDiff = Math.abs(diff);
  const label = locationLabel(locationType);

  if (absDiff < 0.5) {
    return `${label} 조건을 추가해도 예측값 변화가 크지 않았습니다. 이 경우 위치 조건은 예측 성능을 직접 높이는 변수라기보다, 오차가 발생할 수 있는 상황을 해석하는 진단 기준에 가깝다고 볼 수 있습니다.`;
  }

  if (diff > 0) {
    return `${label} 조건을 반영하자 V2 예측값이 V1보다 높아졌습니다. 이 경우 위치 조건은 태풍 세력이 유지되거나 강화될 가능성을 보정하는 예측 변수로 작용했습니다.`;
  }

  return `${label} 조건을 반영하자 V2 예측값이 V1보다 낮아졌습니다. 이 경우 위치 조건은 태풍 세력이 약화될 수 있는 상황을 설명하는 진단 기준으로 작용했습니다.`;
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

  if (isNaN(windInput) || isNaN(pressure) || isNaN(lat) || isNaN(lon)) {
    resultMain.textContent = "-.- m/s";
    resultSub.textContent = "모든 입력 칸에 숫자를 입력해 주세요.";
    resultTag.textContent = "태풍 세기: -";
    resultNote.innerHTML = "입력이 비어 있거나 숫자가 아닙니다.<br>풍속, 기압, 위도, 경도를 모두 다시 확인해 주세요.";
    return;
  }

  let windMs;
  if (unit === "kt") {
    windMs = windInput * 0.514;
  } else {
    windMs = windInput;
  }

  const locationType = classifyLocation(lat, lon);

  const predV1 = predictWindV1(windMs, pressure, lat, lon);
  const predV2 = predictWindV2(windMs, pressure, lat, lon, locationType);

  const predKt = predV2 / 0.514;
  const strength = classifyStrength(predV2);
  const diff = predV2 - predV1;
  const diagnosis = buildDiagnosis(predV1, predV2, locationType);

  resultMain.textContent = `${format(predV2, 1)} m/s`;

  resultSub.textContent =
    `V1 기존 예측: ${format(predV1, 1)} m/s · ` +
    `V2 위치 조건 반영 예측: ${format(predV2, 1)} m/s · ` +
    `차이: ${diff >= 0 ? "+" : ""}${format(diff, 1)} m/s ` +
    `(약 ${format(predKt, 1)} kt)`;

  resultTag.textContent =
    `태풍 세기: ${strength} / 위치 조건: ${locationLabel(locationType)}`;

  const warnings = [];

  if (unit === "kt" && (windInput < 0 || windInput > 120)) {
    warnings.push("풍속이 권장 범위를 벗어났습니다.");
  }

  if (unit === "ms" && (windInput < 0 || windInput > 62)) {
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

  let warningText = "";
  if (warnings.length > 0) {
    warningText = `<br><br>주의: ${warnings.join(" ")}`;
  }

  resultNote.innerHTML =
    `현재 최대풍속, 중심기압, 위도·경도에 더해 해상·연안·육지 위치 조건을 반영했습니다.<br>` +
    `V2 모델은 위치 조건이 예측 성능을 직접 개선하는 변수인지, 또는 오차가 커지는 상황을 설명하는 진단 기준인지 확인하기 위한 탐구용 비교 모델입니다.<br>` +
    `${diagnosis}` +
    warningText;
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
    "현재 최대풍속, 중심기압, 위도·경도 정보를 바탕으로 한 V1 예측과, 해상·연안·육지 위치 조건을 추가한 V2 예측을 비교합니다.";
}

function onSample() {
  const windInput = document.getElementById("windInput");
  const pressureInput = document.getElementById("pressureInput");
  const latInput = document.getElementById("latInput");
  const lonInput = document.getElementById("lonInput");

  if (windInput) windInput.value = 80;
  if (pressureInput) pressureInput.value = 950;
  if (latInput) latInput.value = 25;
  if (lonInput) lonInput.value = 130;

  const radios = document.querySelectorAll('input[name="windUnit"]');
  radios.forEach((r) => {
    if (r.value === "kt") r.checked = true;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const predictBtn = document.getElementById("predictBtn");
  const resetBtn = document.getElementById("resetBtn");
  const sampleBtn = document.getElementById("sampleBtn");

  if (predictBtn) predictBtn.addEventListener("click", onPredict);
  if (resetBtn) resetBtn.addEventListener("click", onReset);
  if (sampleBtn) sampleBtn.addEventListener("click", onSample);
});
