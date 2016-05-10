    function KoTable(params, componentInfo) {
        var self = this;

        self.isLoaded = ko.observable(false);
        self.totalRows = ko.observable(1);
        self.pageNumber = ko.observable(1);
        self.itemsPerPage = ko.observable('10');
        self.itemsPerPageList = ko.observableArray(['10', '25', '50', '100', 'ALL']);
        self.columns = ko.observableArray();
        self.rows = ko.observableArray();
        self.endpoint = ko.observable(params.endpoint);
        self.buttonStyle = ko.observable(params.buttonStyle || "btn btn-block btn-primary");
        self.tableStyle = ko.observable(params.tableStyle || "table");
        self.panelStyle = ko.observable(params.panelStyle || "panel panel-default");
        self.theadStyle = ko.observable(params.theadStyle || " ");
        self.tbodyStyle = ko.observable(params.tbodyStyle || " ");
        self.thStyle = ko.observable(params.thStyle || " ");
        self.trStyle = ko.observable(params.trStyle || " ");
        self.tdStyle = ko.observable(params.tdStyle || " ");
        self.tableName = ko.observable(params.name || "KO Grid");
        self.queryVm = params.queryVm;
        self.searchString = ko.observable();
        
        if (self.queryVm()) {
            for (var prop in self.queryVm()) {
                if (self.queryVm().hasOwnProperty(prop)) {
                    if (ko.isObservable(self.queryVm()[prop])) {
                        self.queryVm()[prop].subscribe(function(value) {
                            self.updateData();
                        });
                    }
                }
            }
        }
        
        self.totalPages = ko.computed(function() {
            return self.totalRows() / self.itemsPerPage();
        });
        self.canGoToPreviousPage = ko.computed(function () {
            return self.pageNumber() > 1;
        });
        self.canGoToNextPage = ko.computed(function () {
            return self.pageNumber() < self.totalPages();
        });
        self.sortBy = ko.computed(function() {
            var ret = "";
            ko.utils.arrayForEach(self.columns(), function(col) {
                if (col.sortedAZ() || col.sortedZA()) {
                    ret = col.name();
                }
            });
            return ret;
        });
        self.sortAscending = ko.computed(function () {
            var ret = false;
            ko.utils.arrayForEach(self.columns(), function (col) {
                if (col.sortedAZ()) {
                    ret = true;
                }
            });
            return ret;
        });

        self.loadColumns(params, function() {
            self.loadRowVm(params, function() {
                self.updateData();
            });
        });


    }

    KoTable.prototype.loadColumns = function (params, callback) {
        var self = this;
        if (params.columns) {
            async.each(params.columns, function(col, callback) {
                if (col.type === 'button') {
                    var newCol = new KoTableColumn(self, {
                        name: col.name,
                        isButton: true,
                        buttonAction: col.action,
                        refresh: col.refresh
                    }, callback);
                    newCol.calculated(true);
                    self.columns.push(newCol);
                } else if (col.type === 'combo') {
                    var newCol = new KoTableColumn(self, {
                        name: col.name,
                        isCombo: true,
                        comboValue: col.valueColumn,
                        comboEndpoint: col.endpoint
                    }, callback);
                    newCol.calculated(true);
                    self.columns.push(newCol);
                }
            }, function(err, res) {
                callback();
            });
        } else {
            callback();
        }
    }
    KoTable.prototype.loadRowVm = function (params, callback) {
        var self = this;
        if (params.rowVm) {
            self.RowVm = require(params.rowVm);
            var dummy = new self.RowVm();
            for (var prop in dummy) {
                if (!self.findColumn(prop) && ko.isObservable(dummy[prop])) {
                    var newCol = new KoTableColumn(self, { name: prop });
                    newCol.calculated(true);
                    self.columns.push(newCol);
                }
            }

        } else {
            self.RowVm = KoTableRow;
        }
        callback();
    }
    KoTable.prototype.addButtonColumn = function() {
        
    }

    KoTable.prototype.goToPreviousPage = function() {
        var self = this;
        self.pageNumber(self.pageNumber() - 1);
        self.updateData();
    }

    KoTable.prototype.goToNextPage = function () {
        var self = this;
        self.pageNumber(self.pageNumber() + 1);
        self.updateData();
    }

    KoTable.prototype.unsortAll = function() {
        var self = this;
        ko.utils.arrayForEach(self.columns(), function(col) {
            col.sortedAZ(false);
            col.sortedZA(false);
        });
    }

    KoTable.prototype.findColumn = function (name) {
        var self = this;
        var ret = false;
        ko.utils.arrayForEach(self.columns(), function(col) {
            if (col.name() === name) {
                ret = col;
            }
        });
        
        return ret;
    }

    KoTable.prototype.getComboItems = function(name) {
        var self = this;
        return self.findColumn(name).comboItems();
    }

    KoTable.prototype.updateData = function() {
        var self = this;
        
        var query = {
            StartRow: (self.pageNumber()-1) * self.itemsPerPage(),
            RowCount:  (self.itemsPerPage() === 'ALL') ? -1: parseInt(self.itemsPerPage()),
            SearchString: self.searchString(),
            SortBy: self.sortBy(),
            SortAscending: self.sortAscending()
        };

        if (self.queryVm()) {
            for (var prop in self.queryVm()) {
                if (self.queryVm().hasOwnProperty(prop)) {
                    if (ko.isObservable(self.queryVm()[prop])) {
                        query[prop] = self.queryVm()[prop]();
                    }
                }
            }
        }


        self.isLoaded(false);
        self.runQuery(query, function(grid) {
            self.isLoaded(true);
        });


    }
    
    KoTable.prototype.runQuery = function (query, callback) {
        var self = this;
        $.getJSON(self.endpoint(), query, function (result) {

            self.rows.removeAll();
            self.totalRows(result.TotalRows);

            var data = result.DataRows;

            for (var prop in data[0]) {
                var column = self.findColumn(prop);
                if (!column) {
                    self.columns.push(new KoTableColumn(self, { name: prop }));
                } else {
                    //even if the column was calculated, we are aboutt to blow it away
                    // so it isnt any more.
                    column.calculated(false);
                }
            }
            for (var j = 0; j < data.length; j++) {
                var newRow = new self.RowVm(self, data[j]);
                for (var prop in data[j]) {
                    //add new extra columns to end of VM
                    if (!newRow.hasOwnProperty(prop)) {
                        newRow[prop] = ko.observable(data[j][prop]);
                    }
                }
                self.rows.push(newRow);
            }
            callback(self);

        });
    }

    KoTable.prototype.csvCurrentPage = function () {
        var self = this;

        self.exportToCsv();

    };

    KoTable.prototype.csvCurrentSearch = function () {
        var self = this;

        var query = {
            StartRow: 0,
            RowCount: -1,
            SearchString: self.searchString(),
            SortBy: self.sortBy(),
            SortAscending: self.sortAscending()
        };

        //var temp = jQuery.extend(true, {}, self);
        var temp = map.fromJS(map.toJS(self));

        temp.runQuery(query, function (grid) {
            grid.exportToCsv();
        });
    };

    KoTable.prototype.csvAllData = function () {
        var self = this;

        var query = {
            StartRow: 0,
            RowCount: -1,
            SearchString: '',
            SortBy: self.sortBy(),
            SortAscending: self.sortAscending()
        };

        //var temp = jQuery.extend(true, {}, self);
        var temp = map.fromJS(map.toJS(self));

        temp.runQuery(query, function (grid) {
            grid.exportToCsv();
        });
    };

    KoTable.prototype.exportToCsv = function () {
        var self = this;
        var filename = self.tableName() + '.csv'
        var csvFile = '';

        ko.utils.arrayForEach(self.rows(), function(row) {
            var j = 0;
            var finalVal = '';
            for (var prop in row) {
                if (row.hasOwnProperty(prop) && ko.isObservable(row[prop])) {
                    var innerValue = row[prop]() === null ? '' : row[prop]().toString();
                    

                    var result = innerValue.replace(/"/g, '""');
                    if (result.search(/("|,|\n)/g) >= 0)
                        result = '"' + result + '"';
                    if (j > 0)
                        finalVal += ',';
                    finalVal += result;
                    j++;
                }
            }
            csvFile += finalVal + "\n";
        });

        var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, filename);
        } else {
            var link = document.createElement("a");
            if (link.download !== undefined) { // feature detection
                // Browsers that support HTML5 download attribute
                var url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", filename);
                link.style = "visibility:hidden";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    }
