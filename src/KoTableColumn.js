function KoTableColumn(parent, config, callback) {
        var self = this;

        self.parent = ko.observable(parent);
        self.name = ko.observable();
        self.sortedZA = ko.observable(false);
        self.sortedAZ = ko.observable(false);
        self.calculated = ko.observable(false);
        self.isButton = ko.observable(false);
        self.isCombo = ko.observable(false);
        self.buttonAction = ko.observable();
        self.comboEndpoint = ko.observable();
        self.comboValue = ko.observable();
        self.comboItems = ko.observableArray();
        self.refresh = ko.observable(true);

        self.headerClick = function () {
            if (self.calculated()) {
                return;
            }
            if (self.sortedAZ()) {
                self.parent().unsortAll();
                self.sortedAZ(false);
                self.sortedZA(true);
                self.parent().updateData();
            }
            else if (self.sortedZA()) {
                self.parent().unsortAll();
                self.sortedAZ(false);
                self.sortedZA(false);
                self.parent().updateData();
            } else {
                self.parent().unsortAll();
                self.sortedAZ(true);
                self.sortedZA(false);
                self.parent().updateData();
            }
        }
        self.isText = ko.computed(function() {
            return !self.isButton() && !self.isCombo();
        });

        self.customAction = function(rowVm) {
            rowVm[self.buttonAction()]();
            if (self.refresh()) {
                self.parent().updateData();
            }
            
        }
        if (config) {
            if (config.name) {
                self.name(config.name);
            }
            if (config.isButton) {
                self.isButton(config.isButton);
            }
            if (config.buttonAction) {
                self.buttonAction(config.buttonAction);
            }
            if (config.isCombo) {
                self.isCombo(config.isCombo);
            }
            if (config.comboEndpoint) {
                self.comboEndpoint(config.comboEndpoint);
            }
            if (config.comboValue) {
                self.comboValue(config.comboValue);
            }
            if (typeof config.refresh !== "undefined") {
                self.refresh(config.refresh);
            }
        }

        if (self.isCombo()) {
            $.get(self.comboEndpoint(), function (result) {
                self.comboItems(result);
                if (callback) callback();
            });
        } else {
            if (callback) callback();
        }

    }