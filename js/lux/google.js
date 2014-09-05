
    //  Google Spreadsheet API
    //  -----------------------------
    //
    //  Create one by passing the key of the spreadsheeet containing data
    //
    //      var api = $lux.api({name: 'googlesheets', url: sheetkey});
    //
    lux.createApi('googlesheets', {
        //
        endpoint: "https://spreadsheets.google.com",
        //
        url: function () {
            // when given the url is of the form key/worksheet where
            // key is the key of the spreadsheet you want to retrieve,
            // worksheet is the positional or unique identifier of the worksheet
            if (this._url)
                return this.endpoint + '/feeds/list/' + this._url + '/public/values?alt=json';
        },
        //
        getMany: function (options) {
            var Model = this.Model,
                $lux = this.$lux;
            return this.request('GET', null, options).success(function (data) {
                return new Model($lux, data);
            });
        },
        //
        Model: function ($lux, data) {
            var i, j, ilen, jlen;
            this.column_names = [];
            this.name = data.feed.title.$t;
            this.elements = [];
            this.raw = data; // A copy of the sheet's raw data, for accessing minutiae

            if (typeof(data.feed.entry) === 'undefined') {
                $lux.log.warn("Missing data for " + this.name + ", make sure you didn't forget column headers");
                return;
            }

            for (var key in data.feed.entry[0]) {
                if (/^gsx/.test(key)) this.column_names.push(key.replace("gsx$", ""));
            }

            for (i = 0, ilen = data.feed.entry.length; i < ilen; i++) {
                var source = data.feed.entry[i];
                var element = {};
                for (j = 0, jlen = this.column_names.length; j < jlen; j++) {
                    var cell = source["gsx$" + this.column_names[j]];
                    if (typeof(cell) !== 'undefined') {
                        if (cell.$t !== '' && !isNaN(cell.$t))
                            element[this.column_names[j]] = +cell.$t;
                        else
                            element[this.column_names[j]] = cell.$t;
                    } else {
                        element[this.column_names[j]] = '';
                    }
                }
                if (element.rowNumber === undefined)
                    element.rowNumber = i + 1;
                this.elements.push(element);
            }
        }
    });