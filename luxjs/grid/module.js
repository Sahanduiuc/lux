/*jshint sub:true*/

    angular.module('lux.grid', ['ngTouch', 'ui.grid'])

        .service('gridService', ['$lux', function ($lux) {

            this.api_mock_data = {
                'user': {
                    'columns': [
                        {field: 'id', displayName: 'ID'},
                        {field: 'user', displayName: 'user'},
                        {field: 'edit', cellTemplate: '<div><button class="btn btn-primary" ng-click=" getExternalScopes().onClick(row.entity.fullName)">Edit</button></div>'}
                    ],
                    'rows': [{
                        'id': 1,
                        'user': 'Marius',
                    }, {
                        'id': 2,
                        'user': 'Adam',
                    }]
                },
                'group': {
                    'columns': [
                        {field: 'id', displayName: 'ID'},
                        {field: 'group', displayName: 'Group'}
                    ],
                    'rows': [{
                        'id': 1,
                        'group': 'Admins',
                    }, {
                        'id': 2,
                        'group': 'Staff',
                    }]
                },
                'exchange': {
                    'columns': [
                        {field: 'id', displayName: 'ID'},
                        {field: 'exchange', displayName: 'Exchange'},
                        {field: 'price', displayName: 'Price'}
                    ],
                    'rows': [{
                        'id': 1,
                        'exchange': 'Admins',
                        'price': 100,
                    }, {
                        'id': 2,
                        'exchange': 'Staff',
                        'price': 200,
                    }]
                }
            };

            this.getModelData = function() {
                var loc = window.location,
                    path = loc.pathname,
                    model = path.split('/').pop(-1),
                    modelDefs;

                if (this.api_mock_data.hasOwnProperty(model)) {
                    modelDefs = this.api_mock_data[model];
                    return modelDefs;
                }
            };

        }])

        .controller('RestGrid', ['$scope', '$lux', 'gridService', function (scope, $lux, gridService) {

            var client = scope.api(),
                gridData = gridService.getModelData();

            scope.gridOptions = {
                data: gridData.rows,
                columnDefs: gridData.columns
            };

        }]);
