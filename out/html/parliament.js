// parliament drawer code
var parliament = d3.parliament();
parliament.width(500).height(500).innerRadiusCoef(0.4);
parliament.enter.fromCenter(true).smallToBig(true);
parliament.exit.toCenter(false).bigToSmall(true);

data = [
    {
        "id": "kpd",
        "legend": "KPD",
        "name": "KPD",
        "seats": 9,
        "color": "#8B0000"
    },
    {
        "id": "spd",
        "legend": "SPD",
        "name": "SPD",
        "seats": 26,
        "color": "#E3000F"
    },
    {
        "id": "ddp",
        "legend": "DDP",
        "name": "DDP",
        "seats": 6,
        "color": "#DCCA4A"
    },
    {
        "id": "z",
        "legend": "Center",
        "name": "Center",
        "seats": 14,
        "color": "#000"
    },
    {
        "id": "bvp",
        "legend": "BVP",
        "name": "BVP",
        "seats": 3,
        "color": "#69A2BE"
    },
    {
        "id": "dvp",
        "legend": "DVP",
        "name": "DVP",
        "seats": 10,
        "color": "#D5AC27"
    },
    {
        "id": "other",
        "legend": "Other",
        "name": "Other",
        "seats": 10,
        "color": "#a0a0a0"
    },
    {
        "id": "dnvp",
        "legend": "DNVP",
        "name": "DNVP",
        "seats": 20,
        "color": "#3f7bc1"
    },
    {
        "id": "nsdap",
        "legend": "NSDAP",
        "name": "NSDAP",
        "seats": 3,
        "color": "#954B00"
    },
];
d3.select("svg").datum(data).call(parliament);
