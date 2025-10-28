// Auto-generated from scikit-learn DecisionTreeRegressor
// Inputs: wind_kt (노트), pressure (hPa), lat (deg), lon (deg)
// Output: m/s (6시간 뒤 예측 풍속)
function predictNextWindMps(wind_kt, pressure, lat, lon) {
  // 학습시 사용한 입력을 그대로 맞추기 위해 kt→m/s 변환
  var wind_ms = wind_kt * 0.514;

  if (wind_ms <= 21.844999) {
    if (wind_ms <= 19.275000) {
      return 20.560000;
    } else {
      return 23.130000;
    }
  } else {
    if (lon <= 127.349998) {
      if (wind_ms <= 24.415000) {
        return 25.700000;
      } else {
        return 27.413333;
      }
    } else {
      return 23.130000;
    }
  }
  // 위에서 생성된 if-else 트리 본문
}

// 브라우저 콘솔 테스트 예시:
// predictNextWindMps(50, 970, 25.2, 126.3);
