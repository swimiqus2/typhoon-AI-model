// Auto-generated DecisionTree (with simple location features)
// Inputs: wind_kt, pressure, lat, lon, over_land(0/1), near_coast(0/1)
// Output: m/s
function predictNextWindMps(wind_kt, pressure, lat, lon, over_land=null, near_coast=null) {
  var wind_ms = wind_kt * 0.514;

  // 체크 안 하면(=null) 아주 단순 휴리스틱으로 기본값 추정
  function coarse_over_land(lat, lon){
    const boxes = [
      [33,39,125,130],  // Korea
      [30,46,129,146],  // Japan
      [21,25,119,122],  // Taiwan
      [5,20,116,126],   // Philippines N
      [20,40,108,123],  // China coast wide
    ];
    for (const b of boxes){
      if (lat>=b[0] && lat<=b[1] && lon>=b[2] && lon<=b[3]) return 1;
    }
    return 0;
  }
  function coarse_near_coast(lat, lon){
    return (lat>=22 && lat<=40 && lon>=120 && lon<=130) ? 1 : 0;
  }

  if (over_land === null) over_land = coarse_over_land(lat, lon);
  if (near_coast === null) near_coast = coarse_near_coast(lat, lon);

  if (wind_ms <= 21.844999) {
    if (pressure <= 982.500000) {
      return 23.130000;
    } else {
      return 20.560000;
    }
  } else {
    if (lon <= 127.349998) {
      if (wind_ms <= 24.415000) {
        return 25.700000;
      } else {
        if (lon <= 127.000000) {
          return 28.270000;
        } else {
          return 25.700000;
        }
      }
    } else {
      return 23.130000;
    }
  }
  // 트리 본문
}
