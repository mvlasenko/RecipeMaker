(function () {

    var config = {
        apiKey: "AIzaSyBRJ8oje7K8awzALA7_LAZxIH1xbl0B1Iw",
        authDomain: "recipe-3cd6d.firebaseapp.com",
        databaseURL: "https://recipe-3cd6d.firebaseio.com",
        projectId: "recipe-3cd6d",
        storageBucket: "recipe-3cd6d.appspot.com",
        messagingSenderId: "968446469824"
    };
    firebase.initializeApp(config);

    angular
        .module('app', ['firebase'])
        .controller('MyCtrl', ["$scope", "$firebaseArray", function ($scope, $firebaseArray) {
            const ref = firebase.database().ref().child('recipe-tracker');
            $scope.ingedients = $firebaseArray(ref);
        }]);

}());