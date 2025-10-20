用 tailwind css (cdn) 设计页面，拆分 js, css，不使用 node.js
限制页面宽度最大为 1440px/80% 于屏幕宽度
 上方留一 banner 图片（圆角），上方叠加 -20% 不透明度为同样大小的遮罩，图片依 cookies 设置而显示，缺省为同目录 img 文件夹下的 banner.png。Banner 的上面有两行字，第一行是时间段问候（如“上午好！”）+ 时钟（“现在是 11:48”），第二行是每日语句（用一言获取），白色字，字体为
下方是天气内容，显示近 5 天天气，实时天气，12 小时内降水量情况（天气逻辑见下文）
再下方是搜索框，允许切换搜索引擎，回车或点击搜索在新页面打开结果
下方为网址导航，用多 Tab 大卡片方式展示（从 json 中读取生成导航）
设置页面（入口页面右角），允许修改 Banner 图片地址，并指定天气城市位置，可以填入纬度，经度（不填从 API 请求时填为 0），可以搜索城市（见下文）
右上角在设置左显示“距 XX 还有”（小置于上）“XXX 天”（大置于下），从设置修改倒计时日期（内置高考）
天气部分示范 C# 代码与文档：
1. 查询城市：
```csharp
    public async Task<List<City>> GetCitiesByName(string name)
    {
        var uri = new Uri("https://weatherapi.market.xiaomi.com/wtr-v3/location/city/hots?locale=zh_cn");
        var logText = "获取热门城市信息";

        if (name != string.Empty)
        {
            uri = new Uri(
                $"https://weatherapi.market.xiaomi.com/wtr-v3/location/city/search?name={Uri.EscapeDataString(name)}&locale=zh_cn");
            logText = logText.Replace("热门", "");
        }

        try
        {
            Logger.LogInformation("{}： {}", logText, uri);

            var cityInfoList = await WebRequestHelper.GetJson<List<CityInfo>>(uri);
            
            var cities = cityInfoList?.Where(x => x.LocationKey.StartsWith("weathercn:")).Select(cityInfo => new City
            {
                Name = $"{cityInfo.Name} ({cityInfo.Affiliation})",
                CityId = cityInfo.LocationKey.Split(':')[1]
            }).ToList() ?? new List<City>();

            return cities;
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "{}失败。", logText);
            return [];
        }
    }
```
2. 获取天气：
<h2 id="weather">小米天气</h2>

url：https://weatherapi.market.xiaomi.com/wtr-v3/weather/all

拼接参数：

- `latitude`：纬度信息。可填固定值`0`
- `longitude`：经度信息。可填固定值`0`
- `locationKey`：`weathercn:` + 地区 `city_num`，见[数据库](https://github.com/huanghui0906/API/blob/master/xiaomi_weather.db)中的 `city_num` 字段，例：`weathercn:101010100` 表北京
- `sign`：签名值，固定值`zUFJoAR2ZVrDy1vF3D07`
- `isGlobal`：固定值 `false`
- `locale`：固定值 `zh_cn`
- `days`：获取包括今日在内的几天内的数据。可不填，默认为`5`
- `romVersion`：可不填或者去除该参数
- `appVersion`：可不填或者去除该参数
- `alpha`：可不填或者去除该参数
- `device`：可不填或者去除该参数
- `modDevice`：可不填或者去除该参数

url 示例：[`https://weatherapi.market.xiaomi.com/wtr-v3/weather/all?latitude=110&longitude=112&isLocated=true&locationKey=weathercn%3A101010100&days=15&appKey=weather20151024&sign=zUFJoAR2ZVrDy1vF3D07&romVersion=7.2.16&appVersion=87&alpha=false&isGlobal=false&device=cancro&modDevice=&locale=zh_cn`](https://weatherapi.market.xiaomi.com/wtr-v3/weather/all?latitude=110&longitude=112&isLocated=true&locationKey=weathercn%3A101010100&days=15&appKey=weather20151024&sign=zUFJoAR2ZVrDy1vF3D07&romVersion=7.2.16&appVersion=87&alpha=false&isGlobal=false&device=cancro&modDevice=&locale=zh_cn) 或 [`https://weatherapi.market.xiaomi.com/wtr-v3/weather/all?latitude=110&longitude=112&locationKey=weathercn%3A101010100&days=15&appKey=weather20151024&sign=zUFJoAR2ZVrDy1vF3D07&isGlobal=false&locale=zh_cn`](https://weatherapi.market.xiaomi.com/wtr-v3/weather/all?latitude=110&longitude=112&locationKey=weathercn%3A101010100&days=15&appKey=weather20151024&sign=zUFJoAR2ZVrDy1vF3D07&isGlobal=false&locale=zh_cn)

json 示例：

	{
      "current": {
        "feelsLike": {
          "unit": "℃",
          "value": "22"
        },
        "humidity": {
          "unit": "%",
          "value": "56"
        },
        "pressure": {
          "unit": "mb",
          "value": "1010.4"
        },
        "pubTime": "2017-02-20T15:25:00+08:00",
        "temperature": {
          "unit": "℃",
          "value": "21"
        },
        "uvIndex": "2",
        "visibility": {
          "unit": "km",
          "value": ""
        },
        "weather": "0",
        "wind": {
          "direction": {
            "unit": "°",
            "value": "360"
          },
          "speed": {
            "unit": "km/h",
            "value": "3.0"
          }
        }
      },
      "forecastDaily": {
        "aqi": {
          "brandInfo": {
            "brands": [
              {
                "brandId": "caiyun",
                "logo": "http://f5.market.mi-img.com/download/MiSafe/0d2cde44e7d5b4a742b9846b8e5aaae62ebed7784/a.webp",
                "names": {
                  "en_US": "彩云天气",
                  "zh_TW": "彩雲天氣",
                  "zh_CN": "彩云天气"
                },
                "url": ""
              }
            ]
          },
          "pubTime": "2017-02-20T00:00:00+08:00",
          "status": 0,
          "value": [
            130,
            66,
            27,
            24,
            45
          ]
        },
        "precipitationProbability": {
          "status": 0,
          "value": [
            "8",
            "25",
            "73",
            "58",
            "6"
          ]
        },
        "pubTime": "2017-02-20T15:10:00+08:00",
        "status": 0,
        "sunRiseSet": {
          "status": 0,
          "value": [
            {
              "from": "2017-02-20T06:50:00+08:00",
              "to": "2017-02-20T18:10:00+08:00"
            },
            {
              "from": "2017-02-21T06:50:00+08:00",
              "to": "2017-02-21T18:11:00+08:00"
            },
            {
              "from": "2017-02-22T06:49:00+08:00",
              "to": "2017-02-22T18:11:00+08:00"
            },
            {
              "from": "2017-02-23T06:48:00+08:00",
              "to": "2017-02-23T18:12:00+08:00"
            },
            {
              "from": "2017-02-24T06:47:00+08:00",
              "to": "2017-02-24T18:13:00+08:00"
            }
          ]
        },
        "temperature": {
          "status": 0,
          "unit": "℃",
          "value": [
            {
              "from": "23",
              "to": "9"
            },
            {
              "from": "13",
              "to": "7"
            },
            {
              "from": "7",
              "to": "4"
            },
            {
              "from": "8",
              "to": "6"
            },
            {
              "from": "12",
              "to": "5"
            }
          ]
        },
        "weather": {
          "status": 0,
          "value": [
            {
              "from": "1",
              "to": "1"
            },
            {
              "from": "7",
              "to": "22"
            },
            {
              "from": "8",
              "to": "7"
            },
            {
              "from": "2",
              "to": "2"
            },
            {
              "from": "1",
              "to": "1"
            }
          ]
        },
        "wind": {
          "direction": {
            "status": 0,
            "unit": "°",
            "value": [
              {
                "from": "360",
                "to": "360"
              },
              {
                "from": "360",
                "to": "360"
              },
              {
                "from": "0",
                "to": "0"
              },
              {
                "from": "360",
                "to": "360"
              },
              {
                "from": "360",
                "to": "360"
              }
            ]
          },
          "speed": {
            "status": 0,
            "unit": "km/h",
            "value": [
              {
                "from": "3.0",
                "to": "3.0"
              },
              {
                "from": "0.0",
                "to": "0.0"
              },
              {
                "from": "24.0",
                "to": "24.0"
              },
              {
                "from": "0.0",
                "to": "0.0"
              },
              {
                "from": "0.0",
                "to": "0.0"
              }
            ]
          }
        }
      },
      "forecastHourly": {
        "aqi": {
          "brandInfo": {
            "brands": [
              {
                "brandId": "caiyun",
                "logo": "http://f5.market.mi-img.com/download/MiSafe/0d2cde44e7d5b4a742b9846b8e5aaae62ebed7784/a.webp",
                "names": {
                  "en_US": "彩云天气",
                  "zh_TW": "彩雲天氣",
                  "zh_CN": "彩云天气"
                },
                "url": ""
              }
            ]
          },
          "pubTime": "2017-02-20T16:00:00+08:00",
          "status": 0,
          "value": [
            50,
            47,
            47,
            47,
            50,
            55,
            59,
            63,
            64,
            61,
            52,
            43,
            35,
            31,
            29,
            27,
            27,
            26,
            24,
            23,
            22,
            20,
            20
          ]
        },
        "status": 0,
        "temperature": {
          "pubTime": "2017-02-20T16:00:00+08:00",
          "status": 0,
          "unit": "",
          "value": [
            18,
            15,
            13,
            11,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            9,
            9,
            8,
            8,
            8,
            8,
            10,
            10,
            11,
            12,
            13,
            13
          ]
        },
        "weather": {
          "pubTime": "2017-02-20T16:00:00+08:00",
          "status": 0,
          "value": [
            0,
            0,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            0,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            2,
            2,
            2,
            3
          ]
        }
      },
      "indices": {
        "indices": [
          {
            "type": "uvIndex",
            "value": "2"
          },
          {
            "type": "humidity",
            "value": "56"
          },
          {
            "type": "feelsLike",
            "value": "22"
          },
          {
            "type": "pressure",
            "value": "1010.4"
          },
          {
            "type": "carWash",
            "value": "1"
          },
          {
            "type": "sports",
            "value": "0"
          }
        ],
        "pubTime": "",
        "status": 0
      },
      "aqi": {
        "aqi": "130",
        "brandInfo": {
          "brands": [
            {
              "brandId": "CNEMC",
              "logo": "",
              "names": {
                "en_US": "CNEMC",
                "zh_TW": "中國環境監測總站",
                "zh_CN": "中国环境监测总站"
              },
              "url": ""
            }
          ]
        },
        "co": "1",
        "no2": "33",
        "o3": "89",
        "pm10": "159",
        "pm25": "99",
        "primary": "pm10",
        "pubTime": "2017-02-20T14:00:00+08:00",
        "so2": "31",
        "src": "中国环境监测总站",
        "status": 0
      },
      "alerts": [],
      "yesterday": {
        "aqi": "223",
        "date": "2017-02-19T12:10:00+08:00",
        "status": 0,
        "sunRise": "2017-02-19T06:51:00+08:00",
        "sunSet": "2017-02-19T18:09:00+08:00",
        "tempMax": "21",
        "tempMin": "10",
        "weatherEnd": "1",
        "weatherStart": "2",
        "windDircEnd": "360",
        "windDircStart": "360",
        "windSpeedEnd": "0.0",
        "windSpeedStart": "0.0"
      },
      "url": {
        "weathercn": "",
        "caiyun": ""
      },
      "brandInfo": {
        "brands": [
          {
            "brandId": "caiyun",
            "logo": "http://f5.market.mi-img.com/download/MiSafe/0d2cde44e7d5b4a742b9846b8e5aaae62ebed7784/a.webp",
            "names": {
              "en_US": "彩云天气",
              "zh_TW": "彩雲天氣",
              "zh_CN": "彩云天气"
            },
            "url": ""
          }
        ]
      }
    }

解析：

- `current`：当前天气状况
	- `feelsLike`：体感温度
	- `humidity`：相对空气湿度
	- `pressure`：气压
	- `temperature`：温度
	- `visibility`：能见度
	- `wind`：风信息
		- `unit`：该值单位
		- `value`：该值
	- `weather`：天气状况，[查看天气状况 json](https://github.com/huanghui0906/API/blob/master/xiaomi_weather_status.json)
	- `pubTime`：更新时间
	- `uvIndex`：???
- `forecastDaily`：今日预测
	- `aqi`：空气质量相关
		- `pubTime`：更新时间
		- `value`：包括今日的五日内空气质量指数
	- `precipitationProbability`：降雨概率
		- `value`：包括今日的五日内降雨概率
	- `sunRiseSet`：日落日出相关
		- `from`：日出时间
		- `to`：日落时间
	- `temperature`：温度信息
		- `unit`：温度单位
		- `value`：包括今日的五日内温度信息
			- `from`：最高气温
			- `to`：最低气温
	- `weather`：天气状况，[查看天气状况 json](https://github.com/huanghui0906/API/blob/master/xiaomi_weather_status.json)
	- `wind`：风信息
		- `direction`：风向
		- `speed`：风速
			- `unit`：该值单位
			- `from` 或 `to`：该值
- `forecastHourly`：今日小时预警
	- `aqi`：空气质量指数
	- `temperature`：温度信息
	- `weather`：天气状况，[查看天气状况 json](https://github.com/huanghui0906/API/blob/master/xiaomi_weather_status.json)
		- `value`：今日二十四小时内的值
- `indices`：原型
- `aqi`：空气相关
	- `aqi`：空气质量指数
	- `co`：一氧化碳指数
	- `no2`：二氧化氮指数
	- `o3`：臭氧指数
	- `pm10`：pm10指数
	- `pm25`：pm2.5指数
	- `so2`：二氧化硫指数
	- `src`：来源地
- `yesterday`：昨日信息
	- `aqi`：空气质量指数
	- `date`：日期
	- `sunRise`：日出时间
	- `sunSet`：日落时间
	- `tempMax`：最高气温
	- `tempMin`：最低气温
	- `weatherEnd`：结束天气
	- `weatherStart`：起始天气
	- `windDircEnd`：结束风向
	- `windDircStart`：起始风向
	- `windSpeedEnd`：结束风速
	- `windSpeedStart`：起始风速
天气状况代码：
{
  "weatherinfo": [
    {
      "code": 0,
      "wea": "晴"
    },
    {
      "code": 1,
      "wea": "多云"
    },
    {
      "code": 2,
      "wea": "阴"
    },
    {
      "code": 3,
      "wea": "阵雨"
    },
    {
      "code": 4,
      "wea": "雷阵雨"
    },
    {
      "code": 5,
      "wea": "雷阵雨并伴有冰雹"
    },
    {
      "code": 6,
      "wea": "雨夹雪"
    },
    {
      "code": 7,
      "wea": "小雨"
    },
    {
      "code": 8,
      "wea": "中雨"
    },
    {
      "code": 9,
      "wea": "大雨"
    },
    {
      "code": 10,
      "wea": "暴雨"
    },
    {
      "code": 11,
      "wea": "大暴雨"
    },
    {
      "code": 12,
      "wea": "特大暴雨"
    },
    {
      "code": 13,
      "wea": "阵雪"
    },
    {
      "code": 14,
      "wea": "小雪"
    },
    {
      "code": 15,
      "wea": "中雪"
    },
    {
      "code": 16,
      "wea": "大雪"
    },
    {
      "code": 17,
      "wea": "暴雪"
    },
    {
      "code": 18,
      "wea": "雾"
    },
    {
      "code": 19,
      "wea": "冻雨"
    },
    {
      "code": 20,
      "wea": "沙尘暴"
    },
    {
      "code": 21,
      "wea": "小雨-中雨"
    },
    {
      "code": 22,
      "wea": "中雨-大雨"
    },
    {
      "code": 23,
      "wea": "大雨-暴雨"
    },
    {
      "code": 24,
      "wea": "暴雨-大暴雨"
    },
    {
      "code": 25,
      "wea": "大暴雨-特大暴雨"
    },
    {
      "code": 26,
      "wea": "小雪-中雪"
    },
    {
      "code": 27,
      "wea": "中雪-大雪"
    },
    {
      "code": 28,
      "wea": "大雪-暴雪"
    },
    {
      "code": 29,
      "wea": "浮尘"
    },
    {
      "code": 30,
      "wea": "扬沙"
    },
    {
      "code": 31,
      "wea": "强沙尘暴"
    },
    {
      "code": 32,
      "wea": "飑"
    },
    {
      "code": 33,
      "wea": "龙卷风"
    },
    {
      "code": 34,
      "wea": "若高吹雪"
    },
    {
      "code": 35,
      "wea": "轻雾"
    },
    {
      "code": 53,
      "wea": "霾"
    },
    {
      "code": 99,
      "wea": "未知"
    }
  ]
}