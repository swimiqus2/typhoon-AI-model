function getNumber(id) {
  var el = document.getElementById(id);
  if (!el) return NaN;
  var v = parseFloat(el.value);
  return isNaN(v) ? NaN : v;
}

function getWindUnit() {
  var radios = document.querySelectorAll('input[name="windUnit"]');
  for (var i = 0; i < radios.length; i++) {
    if (radios[i].checked) return radios[i].value;
  }
  return "kt";
}

function classifyStrength(ms) {
  if (ms < 10) return "약한 열대저기압 수준";
  if (ms < 17) return "약한 태풍 (10-17 m/s)";
  if (ms < 33) return "중간 세기 태풍 (17-33 m/s)";
  return "강한 태풍 (33 m/s 이상)";
}

function classifyLocation(lat, lon) {
  if (lat >= 33 && lon >= 124 && lon <= 132) {
    return "land";
  }
  if (lat >= 27 && lat < 33 && lon >= 122 && lon <= 135) {
    return "coast";
  }
  return "sea";
}

function locationLabel(type) {
  if (type === "sea") return "해상";
  if (type === "coast") return "연안";
  if (type === "land") return "육지";
  return "미분류";
}

function predictWindV1(currentMs, pressure, lat, lon) {
  var pred = currentMs;

  if (pressure < 950) {
    pred += 3;
  } else if (pressure > 1005) {
    pred -= 2;
  }

  if (lat > 30) {
    pred -= 1.5;
  } else if (lat < 15) {
    pred += 0.5;
  }

  if (lon > 140) {
    pred -= 0.5;
  }

  if (pred < 0) pred = 0;
  return pred;
}

function predictWindV2(currentMs, pressure, lat, lon, locationType) {
  var pred = predictWindV1(currentMs, pressure, lat, lon);

  if (locationType === "sea") {
    if (pressure < 970) {
      pred += 1.2;
    } else {
      pred += 0.5;
    }
  }

  if (locationType === "coast") {
    pred -= 0.3;
    if (currentMs >= 33) {
      pred -= 0.7;
    }
  }

  if (locationType === "land") {
    pred -= 2.0;
    if (currentMs >= 25) {
      pred -= 1.0;
    }
  }

  if (pred < 0) pred = 0;
  return pred;
}

function format(value, digits) {
  return value.toFixed(digits || 1);
}

function buildDiagnosis(v1, v2, locationType) {
  var diff = v2 - v1;
  var absDiff = Math.abs(diff);
  var label = locationLabel(locationType);

  if (absDiff < 0.5) {
    return label + " 조건을 추가해도 예측값 변화가 크지 않았습니다. 이 경우 위치 조건은 예측 성능을 직접 높이는 변수라기보다 오차가 발생할 수 있는 상황을 해석하는 진단 기준에 가깝다고 볼 수 있습니다.";
  }

  if (diff > 0) {
    return label + " 조건을 반영하자 V2 예측값이 V1보다 높아졌습니다. 이 경우 위치 조건은 태풍 세력이 유지되거나 강화될 가능성을 보정하는 예측 변수로 작용했습니다.";
  }

  return label + " 조건을 반영하자 V2 예측값이 V1보다 낮아졌습니다. 이 경우 위치 조건은 태풍 세력이 약화될 수 있는 상황을 설명하는 진단 기준으로 작용했습니다.";
}

function onPredict() {
  var windInput = getNumber("windInput");
  var pressure = getNumber("pressureInput");
  var lat = getNumber("latInput");
  var lon = getNumber("lonInput");
  var unit = getWindUnit();

  var resultMain = document.getElementById("resultMain");
  var resultSub = document.getElementById("resultSub");
  var resultTag = document.getElementById("resultTag");
  var resultNote = document.getElementById("resultNote");

  if (!resultMain || !resultSub || !resultTag || !resultNote) {
    alert("결과 표시 영역을 찾지 못했습니다. index.html의 id를 확인해야 합니다.");
    return;
  }

  if (isNaN(windInput) || isNaN(pressure) || isNaN(lat) || isNaN(lon)) {
    resultMain.textContent = "-.- m/s";
    resultSub.textContent = "모든 입력 칸에 숫자를 입력해 주세요.";
    resultTag.textContent = "태풍 세기: -";
    resultNote.innerHTML = "입력이 비어 있거나 숫자가 아닙니다.<br>풍속, 기압, 위도, 경도를 모두 다시 확인해 주세요.";
    return;
  }

  var windMs = unit === "kt" ? windInput * 0.514 : windInput;
  var locationType = classifyLocation(lat, lon);

  var predV1 = predictWindV1(windMs, pressure, lat, lon);
  var predV2 = predictWindV2(windMs, pressure, lat, lon, locationType);

  var predKt = predV2 / 0.514;
  var strength = classifyStrength(predV2);
  var diff = predV2 - predV1;
  var diagnosis = buildDiagnosis(predV1, predV2, locationType);

  resultMain.textContent = format(predV2, 1) + " m/s";
  resultSub.textContent =
    "V1 기존 예측: " + format(predV1, 1) + " m/s · " +
    "V2 위치 조건 반영 예측: " + format(predV2, 1) + " m/s · " +
    "차이: " + (diff >= 0 ? "+" : "") + format(diff, 1) + " m/s " +
    "(약 " + format(predKt, 1) + " kt)";

  resultTag.textContent =
    "태풍 세기: " + strength + " / 위치 조건: " + locationLabel(locationType);

  resultNote.innerHTML =
    "현재 최대풍속, 중심기압, 위도·경도에 더해 해상·연안·육지 위치 조건을 반영했습니다.<br>" +
    "V2 모델은 위치 조건이 예측 성능을 직접 개선하는 변수인지 또는 오차가 커지는 상황을 설명하는 진단 기준인지 확인하기 위한 탐구용 비교 모델입니다.<br>" +
    diagnosis;
}

function onReset() {
  var ids = ["windInput", "pressureInput", "latInput", "lonInput"];
  for (var i = 0; i < ids.length; i++) {
    var el = document.getElementById(ids[i]);
    if (el) el.value = "";
  }

  var resultMain = document.getElementById("resultMain");
  var resultSub = document.getElementById("resultSub");
  var resultTag = document.getElementById("resultTag");
  var resultNote = document.getElementById("resultNote");

  if (resultMain) resultMain.textContent = "-.- m/s";
  if (resultSub) resultSub.textContent = "아직 예측을 실행하지 않았습니다.";
  if (resultTag) resultTag.textContent = "태풍 세기: -";
  if (resultNote) resultNote.innerHTML = "현재 최대풍속, 중심기압, 위도·경도 정보를 바탕으로 한 V1 예측과 해상·연안·육지 위치 조건을 추가한 V2 예측을 비교합니다.";
}

function onSample() {
  var windInput = document.getElementById("windInput");
  var pressureInput = document.getElementById("pressureInput");
  var latInput = document.getElementById("latInput");
  var lonInput = document.getElementById("lonInput");

  if (windInput) windInput.value = 80;
  if (pressureInput) pressureInput.value = 950;
  if (latInput) latInput.value = 25;
  if (lonInput) lonInput.value = 130;

  var radios = document.querySelectorAll('input[name="windUnit"]');
  for (var i = 0; i < radios.length; i++) {
    if (radios[i].value === "kt") radios[i].checked = true;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  var predictBtn = document.getElementById("predictBtn");
  var resetBtn = document.getElementById("resetBtn");
  var sampleBtn = document.getElementById("sampleBtn");

  if (predictBtn) predictBtn.addEventListener("click", onPredict);
  if (resetBtn) resetBtn.addEventListener("click", onReset);
  if (sampleBtn) sampleBtn.addEventListener("click", onSample);
});
