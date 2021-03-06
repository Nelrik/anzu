var EditPostController = ['$scope', '$routeParams', '$http', 'Category', 'Upload', 'Post', '$routeParams',
  function($scope, $routeParams, $http, Category, Upload, Post, $routeParams) {

  $scope.publishing = true;
  $scope.message = "";
	$scope.categories = [];

  $scope.post_edit = {
    title: '',
    content: '',
    category: '',
    is_question: false,
    pinned: false
  };

  $scope.adding_file = false;
  $scope.uploadPicture = function(files) {
    if(files.length == 1) {
      var file = files[0];
      $scope.adding_file = true;
      Upload.upload({
        url: layer_path + "post/image",
        file: file
      }).success(function (data) {
        if($scope.post_edit.content.length > 0) {
          $scope.post_edit.content += '\n' + data.url;
        } else {
          $scope.post_edit.content = data.url;
        }
        $scope.post_edit.content += '\n';
        $scope.adding_file = false;
        $('.publish-content textarea').focus();
      }).error(function(data) {
        $scope.adding_file = false;
      });
    }
  };

	$scope.editPost = function() {
    if($scope.post_edit.title === '') {
      $scope.message = "Te falta el título de tu publicación";
    } else if($scope.post_edit.content === '') {
      $scope.message = "Te falta el contenido de tu publicación";
    } else if($scope.post_edit.category.length < 1) {
      $scope.message = "Te falta elegir categoría";
      console.log($scope.post_edit.category, $scope.post_edit.category.length < 1);
    } else {
      $scope.publishing = true;
      $scope.post_edit.name = $scope.post_edit.title;

  		$http.put(layer_path + 'posts/' + $scope.post.id, $scope.post_edit)
        .then(function success(response) {
    			// Return to home
          //console.log(response);
          window.location.href = "/p/" + response.data.slug + "/" + response.data.id;
    		}, function(error) {
          console.log(error);
        });
    }
	};

  if(!$scope.user.isLogged) {
    window.location = '/';
  } else {
    // Load categories
    Category.writable( function (data) {
      $scope.categories = data;

      Post.light({id: $routeParams.id}, function(data) {
        if($scope.can('debug')) console.log(data);
        $scope.post = data;
        $scope.post_edit = {
          title: data.title,
          content: data.content,
          category: data.category,
          kind: 'category-post',
          is_question: data.is_question,
          pinned: data.pinned,
          lock: data.lock
        };
        $scope.publishing = false;
      });
    });
  }
}];