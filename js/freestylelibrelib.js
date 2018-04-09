var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var DateRecord = /** @class */ (function () {
    function DateRecord(date, type) {
        this.date = date;
        this.type = type;
    }
    return DateRecord;
}());
/// <reference path="DateRecord.ts" />
var DataRecord = /** @class */ (function (_super) {
    __extends(DataRecord, _super);
    function DataRecord(id, date, type) {
        var _this = _super.call(this, date, type) || this;
        _this.id = id;
        return _this;
    }
    return DataRecord;
}(DateRecord));
var FoodRecord = /** @class */ (function (_super) {
    __extends(FoodRecord, _super);
    function FoodRecord(id, date, carbs) {
        var _this = _super.call(this, id, date, RecordType.Food) || this;
        _this.carbs = carbs;
        return _this;
    }
    return FoodRecord;
}(DataRecord));
var FreeStyleLibreLib = /** @class */ (function () {
    function FreeStyleLibreLib() {
    }
    /**
     * Parses a text file with a CVS with Freestyle Libre app report data
     *
     * @returns A Report object will all the data on it
     */
    FreeStyleLibreLib.parseReport = function (reportFile) {
        var rawJson = FreeStyleLibreLib._parseCsv(reportFile);
        var patient = null;
        if (rawJson != null && rawJson[0] != null && typeof rawJson[0] == 'string') {
            patient = rawJson[0];
        }
        return FreeStyleLibreLib._createReport(patient, rawJson);
    };
    FreeStyleLibreLib._createReport = function (patient, rawJson) {
        var glucose = [];
        var food = [];
        var insulin = [];
        rawJson.forEach(function (element) {
            var record = FreeStyleLibreLib._parseRecord(element);
            if (record != null) {
                switch (record.type) {
                    case RecordType.Glucose:
                        glucose.push(record);
                        break;
                    case RecordType.Food:
                        food.push(record);
                        break;
                    case RecordType.Insulin:
                        insulin.push(record);
                        break;
                }
            }
        }, this);
        return new Report(patient, glucose, food, insulin);
    };
    FreeStyleLibreLib._parseRecord = function (element) {
        // TODO: Allow settings to format date in other ways
        var date = moment(element.Time, "YYYY/MM/DD HH:mm");
        switch (element.RecordType) {
            case "0":
                return new GlucoseRecord(parseFloat(element.ID), date, GlucoseRecordType.History, new GlucoseValue(parseFloat(element.HistoricGlucose), GlucoseUnit.MmolPerL));
            case "1":
                return new GlucoseRecord(parseFloat(element.ID), date, GlucoseRecordType.Scan, new GlucoseValue(parseFloat(element.ScanGlucose), GlucoseUnit.MmolPerL));
            case "4":
                if (element.RapidActingInsulinUnits.trim() != "")
                    return new InsulinRecord(parseFloat(element.ID), date, InsulinRecordType.Rapid, parseFloat(element.RapidActingInsulinUnits));
                if (element.LongActingInsulinUnits.trim() != "")
                    return new InsulinRecord(parseFloat(element.ID), date, InsulinRecordType.Long, parseFloat(element.LongActingInsulinUnits));
                break;
            case "5":
                return new FoodRecord(parseFloat(element.ID), date, parseFloat(element.Carbs));
        }
        return null;
    };
    FreeStyleLibreLib._parseCsv = function (csvFile) {
        var lines = csvFile.split("\n");
        var result = [];
        var init = 0;
        if (lines[0].indexOf("\t") < 0) {
            result.push(lines[0]);
            init = 1;
        }
        var headers = lines[init].split("\t");
        var sanitizedHeaders = [];
        headers.forEach(function (header) {
            sanitizedHeaders.push(header.replace(/ /g, '')
                .replace(/-/g, '')
                .replace(/\(grams\)/g, '')
                .replace(/\(mmol\/L\)/g, '')
                .replace(/\(units\)/g, 'Units'));
        }, this);
        for (var i = 1 + init; i < lines.length; i++) {
            var obj = {};
            var row = lines[i];
            var queryIdx = 0;
            var startValueIdx = 0;
            var idx = 0;
            while (idx < row.length) {
                // If we meet a double quote we skip until the next one
                var c = row[idx];
                if (c === '"') {
                    do {
                        c = row[++idx];
                    } while (c !== '"' && idx < row.length - 1);
                }
                if (c === '\t' || /* handle end of line with no comma */ idx === row.length - 1) {
                    // We've got a value!
                    var value = row.substr(startValueIdx, idx - startValueIdx).trim();
                    // Skip first double quote
                    if (value[0] === '"') {
                        value = value.substr(1);
                    }
                    // Skip last comma
                    if (value[value.length - 1] === '\t') {
                        value = value.substr(0, value.length - 1);
                    }
                    // Skip last double quote
                    if (value[value.length - 1] === '"') {
                        value = value.substr(0, value.length - 1);
                    }
                    var key = sanitizedHeaders[queryIdx++];
                    obj[key] = value.trim();
                    startValueIdx = idx + 1;
                }
                ++idx;
            }
            result.push(obj);
        }
        return result;
    };
    return FreeStyleLibreLib;
}());
var GlucoseRecord = /** @class */ (function (_super) {
    __extends(GlucoseRecord, _super);
    function GlucoseRecord(id, date, glucoseType, glucose) {
        var _this = _super.call(this, id, date, RecordType.Glucose) || this;
        _this.glucoseType = glucoseType;
        _this.glucose = glucose;
        return _this;
    }
    return GlucoseRecord;
}(DataRecord));
var GlucoseRecordType;
(function (GlucoseRecordType) {
    GlucoseRecordType[GlucoseRecordType["History"] = 0] = "History";
    GlucoseRecordType[GlucoseRecordType["Scan"] = 1] = "Scan";
    GlucoseRecordType[GlucoseRecordType["Strip"] = 2] = "Strip";
})(GlucoseRecordType || (GlucoseRecordType = {}));
var GlucoseUnit;
(function (GlucoseUnit) {
    GlucoseUnit[GlucoseUnit["MmolPerL"] = 0] = "MmolPerL";
    GlucoseUnit[GlucoseUnit["MgPerDl"] = 1] = "MgPerDl";
})(GlucoseUnit || (GlucoseUnit = {}));
var GlucoseValue = /** @class */ (function () {
    function GlucoseValue(value, unit) {
        this._value = value;
        this.unit = unit;
    }
    GlucoseValue.prototype.getValueAsMmolPerL = function () {
        if (this.unit == GlucoseUnit.MmolPerL)
            return this._value;
        return this._value * 18;
    };
    GlucoseValue.prototype.getValueAsMgPerDl = function () {
        if (this.unit == GlucoseUnit.MgPerDl)
            return this._value;
        return this._value / 18;
    };
    return GlucoseValue;
}());
var InsulinRecord = /** @class */ (function (_super) {
    __extends(InsulinRecord, _super);
    function InsulinRecord(id, date, insulinType, units) {
        var _this = _super.call(this, id, date, RecordType.Insulin) || this;
        _this.insulinType = insulinType;
        _this.units = units;
        return _this;
    }
    return InsulinRecord;
}(DataRecord));
var InsulinRecordType;
(function (InsulinRecordType) {
    InsulinRecordType[InsulinRecordType["Rapid"] = 0] = "Rapid";
    InsulinRecordType[InsulinRecordType["Long"] = 1] = "Long";
})(InsulinRecordType || (InsulinRecordType = {}));
var RecordType;
(function (RecordType) {
    RecordType[RecordType["Glucose"] = 0] = "Glucose";
    RecordType[RecordType["Food"] = 1] = "Food";
    RecordType[RecordType["Insulin"] = 2] = "Insulin";
    RecordType[RecordType["SmoothInsulin"] = 3] = "SmoothInsulin";
})(RecordType || (RecordType = {}));
var Report = /** @class */ (function () {
    function Report(patient, glucose, food, insulin) {
        if (patient === void 0) { patient = null; }
        if (glucose === void 0) { glucose = []; }
        if (food === void 0) { food = []; }
        if (insulin === void 0) { insulin = []; }
        this._smoothRapidInsulinByDate = [];
        this._smoothLongInsulinByDate = [];
        this._smoothRapidInsulin = [];
        this._smoothLongInsulin = [];
        this.patient = patient;
        this.glucose = glucose.sort(function (a, b) { return a.date.valueOf() - b.date.valueOf(); });
//        this.insulin = insulin.sort(function (a, b) { return a.date.valueOf() - b.date.valueOf(); });
        this.food = food.sort(function (a, b) { return a.date.valueOf() - b.date.valueOf(); });
        var start = this.glucose[0].date;
//        start = this.insulin[0].date < start ? this.insulin[0].date : start;
        start = this.food[0].date < start ? this.food[0].date : start;
        this.start = start;
        var end = this.glucose[this.glucose.length - 1].date;
//        end = this.insulin[this.insulin.length - 1].date > end ? this.insulin[0].date : end;
        end = this.food[this.food.length - 1].date > end ? this.food[0].date : end;
        this.end = end;
    }
    /**
     * Generate a list of points with spreading the insulin value using a custom curve to estimate the insulin/minute (Based on NovoRapid)
     * Start acting 15m-30m after application, peaks at 1.5h-2h, lose effect arround 4h-5h (effect multiplied by scale factor).
     *
     * @param scale A number to mutiply the insulin effective value
     * @returns A list of SmoothInsulinRecord (date, value) with the insuling effect.
     */
/*    Report.prototype.getSmoothRapidInsulin = function (scale) {
        if (scale === void 0) { scale = 1; }
        if (this._smoothRapidInsulin.length != 0)
            return this._smoothRapidInsulin;
        this.insulin.forEach(function (element) {
            if (element.insulinType == InsulinRecordType.Rapid) {
                var minutes = element.date.minutes();
                var firstPoint = moment(element.date).startOf('hour');
                if (minutes >= 15 && minutes <= 29)
                    firstPoint.add(15, "minutes");
                if (minutes >= 30 && minutes <= 44)
                    firstPoint.add(30, "minutes");
                if (minutes >= 45 && minutes <= 59)
                    firstPoint.add(45, "minutes");
                // TODO: This function needs some backup from studies, rigth now is a "guess"
                this._addSmoothPoint(this._smoothRapidInsulinByDate, moment(firstPoint).add(0, "minutes"), element.units * 0.001 * scale);
                this._addSmoothPoint(this._smoothRapidInsulinByDate, moment(firstPoint).add(15, "minutes"), element.units * 0.001 * scale);
                this._addSmoothPoint(this._smoothRapidInsulinByDate, moment(firstPoint).add(30, "minutes"), element.units * 0.005 * scale);
                this._addSmoothPoint(this._smoothRapidInsulinByDate, moment(firstPoint).add(45, "minutes"), element.units * 0.023 * scale);
                this._addSmoothPoint(this._smoothRapidInsulinByDate, moment(firstPoint).add(60, "minutes"), element.units * 0.057 * scale);
                this._addSmoothPoint(this._smoothRapidInsulinByDate, moment(firstPoint).add(60 + 15, "minutes"), element.units * 0.079 * scale);
                this._addSmoothPoint(this._smoothRapidInsulinByDate, moment(firstPoint).add(60 + 30, "minutes"), element.units * 0.101 * scale);
                this._addSmoothPoint(this._smoothRapidInsulinByDate, moment(firstPoint).add(60 + 45, "minutes"), element.units * 0.111 * scale);
                this._addSmoothPoint(this._smoothRapidInsulinByDate, moment(firstPoint).add(120, "minutes"), element.units * 0.106 * scale);
                this._addSmoothPoint(this._smoothRapidInsulinByDate, moment(firstPoint).add(120 + 15, "minutes"), element.units * 0.101 * scale);
                this._addSmoothPoint(this._smoothRapidInsulinByDate, moment(firstPoint).add(120 + 30, "minutes"), element.units * 0.095 * scale);
                this._addSmoothPoint(this._smoothRapidInsulinByDate, moment(firstPoint).add(120 + 45, "minutes"), element.units * 0.084 * scale);
                this._addSmoothPoint(this._smoothRapidInsulinByDate, moment(firstPoint).add(180, "minutes"), element.units * 0.068 * scale);
                this._addSmoothPoint(this._smoothRapidInsulinByDate, moment(firstPoint).add(180 + 15, "minutes"), element.units * 0.051 * scale);
                this._addSmoothPoint(this._smoothRapidInsulinByDate, moment(firstPoint).add(180 + 30, "minutes"), element.units * 0.045 * scale);
                this._addSmoothPoint(this._smoothRapidInsulinByDate, moment(firstPoint).add(180 + 45, "minutes"), element.units * 0.033 * scale);
                this._addSmoothPoint(this._smoothRapidInsulinByDate, moment(firstPoint).add(240, "minutes"), element.units * 0.022 * scale);
                this._addSmoothPoint(this._smoothRapidInsulinByDate, moment(firstPoint).add(240 + 15, "minutes"), element.units * 0.011 * scale);
                this._addSmoothPoint(this._smoothRapidInsulinByDate, moment(firstPoint).add(240 + 30, "minutes"), element.units * 0.005 * scale);
                this._addSmoothPoint(this._smoothRapidInsulinByDate, moment(firstPoint).add(240 + 45, "minutes"), element.units * 0.001 * scale);
            }
        }, this);
        for (var key in this._smoothRapidInsulinByDate) {
            var date = moment(parseInt(key));
            if (date != undefined) {
                this._smoothRapidInsulin.push(new SmoothInsulinRecord(date, this._smoothRapidInsulinByDate[key]));
            }
        }
        return this._smoothRapidInsulin;
    };*/
    /**
     * Generate a list of points with spreading the insulin value using a custom curve to estimate the insulin/hour (Based on Lantus)
     * Start acting 4h-5h after application, peaks at 6h-7h, lose effect arround 20h-22h (effect multiplied by scale factor).
     *
     * @param scale A number to mutiply the insulin effective value
     * @returns A list of SmoothInsulinRecord (date, value) with the insuling effect.
     */
    Report.prototype.getSmoothLongInsulin = function (scale) {
        if (scale === void 0) { scale = 1; }
        if (this._smoothLongInsulin.length != 0)
            return this._smoothLongInsulin;
        this.insulin.forEach(function (element) {
            if (element.insulinType == InsulinRecordType.Long) {
                var minutes = element.date.minutes();
                var firstPoint = moment(element.date).startOf('hour');
                // TODO: This function needs some backup from studies, rigth now is a "guess"
                this._addSmoothPoint(this._smoothLongInsulinByDate, moment(firstPoint).add(0, "hour"), element.units * 0.000 * scale);
                this._addSmoothPoint(this._smoothLongInsulinByDate, moment(firstPoint).add(1, "hour"), element.units * 0.000 * scale);
                this._addSmoothPoint(this._smoothLongInsulinByDate, moment(firstPoint).add(2, "hour"), element.units * 0.002 * scale);
                this._addSmoothPoint(this._smoothLongInsulinByDate, moment(firstPoint).add(3, "hour"), element.units * 0.014 * scale);
                this._addSmoothPoint(this._smoothLongInsulinByDate, moment(firstPoint).add(4, "hour"), element.units * 0.027 * scale);
                this._addSmoothPoint(this._smoothLongInsulinByDate, moment(firstPoint).add(5, "hour"), element.units * 0.055 * scale);
                this._addSmoothPoint(this._smoothLongInsulinByDate, moment(firstPoint).add(6, "hour"), element.units * 0.091 * scale);
                this._addSmoothPoint(this._smoothLongInsulinByDate, moment(firstPoint).add(7, "hour"), element.units * 0.091 * scale);
                this._addSmoothPoint(this._smoothLongInsulinByDate, moment(firstPoint).add(8, "hour"), element.units * 0.084 * scale);
                this._addSmoothPoint(this._smoothLongInsulinByDate, moment(firstPoint).add(9, "hour"), element.units * 0.075 * scale);
                this._addSmoothPoint(this._smoothLongInsulinByDate, moment(firstPoint).add(10, "hour"), element.units * 0.069 * scale);
                this._addSmoothPoint(this._smoothLongInsulinByDate, moment(firstPoint).add(11, "hour"), element.units * 0.068 * scale);
                this._addSmoothPoint(this._smoothLongInsulinByDate, moment(firstPoint).add(12, "hour"), element.units * 0.067 * scale);
                this._addSmoothPoint(this._smoothLongInsulinByDate, moment(firstPoint).add(13, "hour"), element.units * 0.056 * scale);
                this._addSmoothPoint(this._smoothLongInsulinByDate, moment(firstPoint).add(14, "hour"), element.units * 0.052 * scale);
                this._addSmoothPoint(this._smoothLongInsulinByDate, moment(firstPoint).add(15, "hour"), element.units * 0.049 * scale);
                this._addSmoothPoint(this._smoothLongInsulinByDate, moment(firstPoint).add(16, "hour"), element.units * 0.044 * scale);
                this._addSmoothPoint(this._smoothLongInsulinByDate, moment(firstPoint).add(17, "hour"), element.units * 0.039 * scale);
                this._addSmoothPoint(this._smoothLongInsulinByDate, moment(firstPoint).add(18, "hour"), element.units * 0.038 * scale);
                this._addSmoothPoint(this._smoothLongInsulinByDate, moment(firstPoint).add(19, "hour"), element.units * 0.036 * scale);
                this._addSmoothPoint(this._smoothLongInsulinByDate, moment(firstPoint).add(20, "hour"), element.units * 0.027 * scale);
                this._addSmoothPoint(this._smoothLongInsulinByDate, moment(firstPoint).add(21, "hour"), element.units * 0.014 * scale);
                this._addSmoothPoint(this._smoothLongInsulinByDate, moment(firstPoint).add(22, "hour"), element.units * 0.002 * scale);
                this._addSmoothPoint(this._smoothLongInsulinByDate, moment(firstPoint).add(23, "hour"), element.units * 0.000 * scale);
            }
        }, this);
        for (var key in this._smoothLongInsulinByDate) {
            var date = moment(parseInt(key));
            if (date != undefined) {
                this._smoothLongInsulin.push(new SmoothInsulinRecord(date, this._smoothLongInsulinByDate[key]));
            }
        }
        return this._smoothLongInsulin;
    };
    Report.prototype._addSmoothPoint = function (smoothInsulin, point, value) {
        var initialValue = smoothInsulin[point.valueOf()];
        if (initialValue == undefined) {
            smoothInsulin[point.valueOf()] = value;
        }
        else {
            smoothInsulin[point.valueOf()] = initialValue + value;
        }
    };
    return Report;
}());
var SmoothInsulinRecord = /** @class */ (function (_super) {
    __extends(SmoothInsulinRecord, _super);
    function SmoothInsulinRecord(date, units) {
        var _this = _super.call(this, date, RecordType.SmoothInsulin) || this;
        _this.units = units;
        return _this;
    }
    return SmoothInsulinRecord;
}(DateRecord));
