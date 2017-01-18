var ChatController = [
  '$scope',
  '$firebaseArray',
  '$firebaseObject',
  '$timeout',
  '$location',
  '$route',
  '$routeParams',
  '$http',
  '$uibModal',
  '$geolocation',
  function($scope, $firebaseArray, $firebaseObject, $timeout, $location, $route, $routeParams, $http, $uibModal, $geolocation) {
    $scope.formatted_address=null;
    $scope.$geolocation = $geolocation;
    // basic usage
    $geolocation.getCurrentPosition().then(function(location) {
      $scope.location = location;
      //init geolocation
      if($scope.formatted_address==null){
        var dir = "";
        var lat=$scope.location.coords.latitude;
        var lon=$scope.location.coords.longitude;
        var latlng = new google.maps.LatLng(lat, lon);
        geocoder = new google.maps.Geocoder();
        geocoder.geocode({"latLng": latlng}, function(results, status)
        {
          if(status == google.maps.GeocoderStatus.OK){
            if(results[0]){
              $scope.formatted_address=results[0].formatted_address;
              dir = "Dirección:" + results[0].formatted_address;
            }else{
              dir = "No se ha podido obtener ninguna dirección en esas coordenadas";
            }
          }else{
            dir = "El Servicio de Codificación Geográfica ha fallado con el siguiente error: " + status;
          }
        });
      }//End, init geolocation
    });

    $scope.rifaID=null;
    $scope.tiempo=false;
    $scope.rifa = {
      create: false,
      active: false,
      pregunta: false,
      rifa: false,
      art:{
        cant:0,
        cantComprados:0,
        cantUser:0,
        imgUrl:null,
        nomArt:null,
        precioBole:0,
        userIdG: null,
        userIdGname: null,
        userIdGname_slug: null,
        userIdGemail:null,
        stop:false,
        countrys:null,
        citys:null,
        go:false
      },
      user:{
        cant:1,
        userid:null,
        username:null,
        username_slug:null,
        email:null,
        ticketskey:null
      }
    };
    $scope.dynamicPopover = {
      content: 'Hello, World!',
      templateUrl: 'myPopoverTemplate.html',
      title: 'Title'
    };

    $scope.placement = {
      options: [
        'top',
        'top-left',
        'top-right',
        'bottom',
        'bottom-left',
        'bottom-right',
        'left',
        'left-top',
        'left-bottom',
        'right',
        'right-top',
        'right-bottom'
      ],
      selected: 'top'
    };
    $scope.people = [];

    $scope.membersRef_global = [];
    $scope.emojiMessage = {};

    var firebaseRef = new Firebase(firebase_url);

    // Instantiate a new connection to Firebase.
    $scope._firebase = firebaseRef;

    // A unique id generated for each session.
    $scope._sessionId = null;

    // A mapping of event IDs to an array of callbacks.
    $scope._events = {};

    // A mapping of room IDs to a boolean indicating presence.
    $scope._rooms = {};

    // A mapping of operations to re-queue on disconnect.
    $scope._presenceBits = {};

    // Commonly-used Firebase references.
    $scope._userRef        = null;
    $scope._statusRef      = null;
    $scope._messageRef     = $scope._firebase.child('messages');
    $scope._channelRef     = $scope._firebase.child('channels');
    $scope._rifasRef       = $scope._firebase.child('raffles');
    $scope._participantsRef= $scope._firebase.child('participants');
    $scope._ticketsRef     = $scope._firebase.child('tickets');
    //$scope._privateRoomRef = $scope._firebase.child('room-private-metadata');
    //$scope._moderatorsRef  = $scope._firebase.child('moderators');
    $scope._suspensionsRef = $scope._firebase.child('suspensions');
    //$scope._usersOnlineRef = $scope._firebase.child('user-names-online');

    // Setup and establish default options.
    $scope._options = {};

    // The number of historical messages to load per room.
    $scope._options.numMaxMessages = $scope._options.numMaxMessages || 50;
    $scope._options.messagesLength = $scope._options.messagesLength || 200;

    $scope.channels = [];
    $scope.channel = {
      selected: null
    };
    $scope.messages = [];
    $scope.old_messages = [];
    $scope.message = {
      content: '',
      send_on_enter: true,
      previous: 'Acid Rulz!'
    };
    $scope.show_details = false;

    $scope.members = [];
    $scope.searchText = {
      content: ''
    };

    $scope.helpers = {
      writing: false,
      writing_timeout: null,
      spam_count: 0,
      validated: false,
      loaded: false,
      blocked: false
    };
    $scope.text = '';
    
    $scope.config = {
      autocomplete: [
        {
          words: [/@([A-Za-z0-9]+[_A-Za-z0-9]+)/gi],
          cssClass: 'user'
        }
      ],
      dropdown: [
        {
          trigger: /@([A-Za-z0-9]+[_A-Za-z0-9]+)/gi,
          list: function(match, callback){
              data=[];
              $scope.members.forEach(function (member) {
                var nombre_mem=member.username;
                data.push({username: nombre_mem});
              });
              var listData = data.filter(function(element){
                return element.username.substr(0,match[1].length).toLowerCase() === match[1].toLowerCase()
                && element.username.length > match[1].length;
              }).map(function(element){
                return {
                  display: element.username, // This gets displayed in the dropdown
                  item: element // This will get passed to onSelect
                };
              });
              callback(listData);
          },
          onSelect: function(item){
            enter=true;
            return item.display;
          },
          mode: 'replace'
        }
      ]
    };
    $scope.safeApply = function(fn) {
      var phase = this.$root.$$phase;
      if(phase == '$apply' || phase == '$digest') {
        if(fn && (typeof(fn) === 'function')) {
          fn();
        }
      } else {
        this.$apply(fn);
      }
    };
    $scope.getRandomInt = function(min, max) {
      return Math.floor(Math.random() * (max - min)) + min;
    }
    $scope.ganadorRifa = function(){
      $scope._participantsRef.child($scope.channel.selected.$id)
      .once("value", function(snapshot) {
        var data = snapshot.val();
        //console.log(data);
        var participants = [];
        for(var i in data) {
          var cant=data[i].cant;
          for (var x = 0; x < cant; x++) {
            participants.push([
              data[i].cant,
              data[i].email,
              data[i].userid,
              data[i].username,
              data[i].username_slug
            ]);
          }
        }
        //console.log(participants);
        var max=participants.length;
        var min=0;
        if(max>0){
          var y=0;
          for(var x=1; x<=10 ; x++){
            y = $scope.getRandomInt(min,max);
          }
          $scope._rifasRef.child($scope.channel.selected.$id)
          .update({
            userIdG: participants[y][2],
            userIdGname: participants[y][3],
            userIdGname_slug: participants[y][4],
            userIdGemail: participants[y][1]
          });
        }else{
          alert('No hay participantes');
        }
      }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
      });
    }
    $scope.stopRifa = function(){
      $scope._rifasRef.child($scope.channel.selected.$id)
      .update({
        stop: true
      });
    }
    $scope.startRifa = function(){
      $scope._rifasRef.child($scope.channel.selected.$id)
      .update({
        stop: false
      });
    }
    $scope.updateRifa = function(){
      $scope._ticketsRef.child($scope.channel.selected.$id).once("value", function(snapshot){
        if(snapshot.val()==null){
          var stop=false;
          $scope._rifasRef.child($scope.channel.selected.$id).once("value",function(snapshot2){
            if(snapshot2.val()!=null){
              stop=snapshot2.val().stop;
            }
          });
          $scope._rifasRef.child($scope.channel.selected.$id)
          .update({
            cantComprados: 0,
            stop: stop
          });
        }else{
          var countT=0;
          var stop=false;
          $scope._rifasRef.child($scope.channel.selected.$id).once("value",function(snapshot2){
            if(snapshot2.val()!=null){
              stop=snapshot2.val().stop;
              countT=snapshot2.val().cant;
            }
          });
          var count = Object.keys(snapshot.val()).length;
          if(count>=countT){
            stop = true;
          }
          $scope._rifasRef.child($scope.channel.selected.$id)
          .update({
            /*cantComprados: count,*/
            stop: stop
          });
        }
      });
    }
    $scope.dejarBoletos = function(){
      if(confirm("Desea dejar la rifa?")){
        var arrTK=$scope.rifa.user.ticketskey;
        for (var i = 0; i < arrTK.length; i++) {
          $scope._ticketsRef.child($scope.channel.selected.$id).child(arrTK[i]).set(null);
          $scope.ticketsUPDATE($scope._rifasRef.child($scope.channel.selected.$id),false);
        }        
        var firebaseRefR = $scope._participantsRef.child($scope.channel.selected.$id).child($scope.user.info.id);
        var obj = $firebaseObject(firebaseRefR);
        obj.$remove().then(function(ref){
          // data has been deleted locally and in the database
          $scope.pregunta=true;
          //$scope.updateRifa();
        }, function(error) {
          console.log("Error:", error);
          $scope.pregunta=false;
        });
      }
    };
    $scope.ticketsUPDATE = function (postRef, action) {
      postRef.transaction(function(rifa) {
        if (rifa) {
          if (rifa.cantComprados<rifa.cant && action) {
            rifa.cantComprados++;
          }else if(!action) {
            rifa.cantComprados--;
          }
        }
        return rifa;
      });
    };
    $scope.comprarBoletos = function(){
      //init geolocation
      if($scope.formatted_address==null){
        var dir = "";
        var lat=$scope.location.coords.latitude;
        var lon=$scope.location.coords.longitude;
        var latlng = new google.maps.LatLng(lat, lon);
        geocoder = new google.maps.Geocoder();
        geocoder.geocode({"latLng": latlng}, function(results, status)
        {
          if(status == google.maps.GeocoderStatus.OK){
            if(results[0]){
              $scope.formatted_address=results[0].formatted_address;
              dir = "Dirección:" + results[0].formatted_address;
            }else{
              dir = "No se ha podido obtener ninguna dirección en esas coordenadas";
            }
          }else{
            dir = "El Servicio de Codificación Geográfica ha fallado con el siguiente error: " + status;
          }
        });
      }//End, init geolocation
      if($scope.formatted_address!=null || ($scope.rifa.art.countrys===undefined && $scope.rifa.art.citys===undefined)){
        var yes=false;
        //console.log($scope.formatted_address);
        if($scope.rifa.art.citys===undefined){
        }else{
          var ArrB=$scope.rifa.art.citys;
          var contArr=ArrB.length;
          for (var i = 0; i < contArr; i++) {
            var temp = ArrB[i];
            if ($scope.formatted_address.indexOf(''+temp)!=-1) {
              yes=true;
              break;
            }
          }
        }
        if($scope.rifa.art.countrys===undefined){
        }else{
          var ArrB=$scope.rifa.art.countrys;
          var contArr=ArrB.length;
          for (var i = 0; i < contArr; i++) {
            var temp = ArrB[i];
            if ($scope.formatted_address.indexOf(''+temp)!=-1) {
              yes=true;
              break;
            }
          }
        }
        if($scope.rifa.art.countrys===undefined && $scope.rifa.art.citys===undefined){
          yes=true;
        }
        if(yes){
          if(($scope.rifa.user.cant%1)==0 && $scope.rifa.user.cant>0 && $scope.rifa.user.cant<=$scope.rifa.art.cantUser && $scope.rifa.user.cant<=($scope.rifa.art.cant-$scope.rifa.art.cantComprados)){
            var bolcomp = [];
            for (var i = 0; i < $scope.rifa.user.cant; i++) {
              var count=0;
              $scope._ticketsRef.child($scope.channel.selected.$id).once("value", function(snapshot){
                if(snapshot.val()==null){
                  count = 0;
                }else{
                  count = Object.keys(snapshot.val()).length;
                }
                if(count<$scope.rifa.art.cant){
                  var newticket=$scope._ticketsRef.child($scope.channel.selected.$id)
                  .push($scope.rifa.user);
                  var key = newticket.key();
                  if(key==null){
                  }else{
                    $scope.ticketsUPDATE($scope._rifasRef.child($scope.channel.selected.$id),true);
                    bolcomp.push(key);
                  }
                }
              });
            }
            if(bolcomp.length>0){
              $scope.rifa.user.ticketskey=bolcomp;
              $scope.rifa.user.cant=bolcomp.length;
              $scope._participantsRef.child($scope.channel.selected.$id).child($scope.user.info.id)
              .set($scope.rifa.user, function(error) {
                if(error){
                  $scope.pregunta=true;
                }else{
                  $scope.pregunta=false;
                  //$scope.updateRifa();
                }
              });
            }
            if(bolcomp.length>0 && bolcomp.length<$scope.rifa.user.cant){
              alert("Por la alta demanda de boletos solo pudiste comprar "+bolcomp.length+" boletos");
            }else if(bolcomp.length>0 && bolcomp.length==$scope.rifa.user.cant){
            }else if(bolcomp.length==0){
              alert("Por la alta demanda de boletos no alcanzaste boletos");
            }
          }else if(!($scope.rifa.user.cant%1)==0){
            alert("Deben ser numero enteros sin fracción");
          }else if($scope.rifa.user.cant<=0 || $scope.rifa.user.cant>$scope.rifa.art.cantUser || $scope.rifa.user.cant===undefined){
            alert("Sobrepasas los limite de boletos debe ser minimo 1 y menos o igual que "+$scope.rifa.art.cantUser+" Ó Deben ser numero enteros sin fracción");
          }else if($scope.rifa.user.cant<=($scope.rifa.art.cant-$scope.rifa.art.cantComprados)){
            alert("Lo siento boletos agotados mas rapido la proxima vez");
          }else if($scope.rifa.user.cant>($scope.rifa.art.cant-$scope.rifa.art.cantComprados)){
            alert("Lo siento Intentaste comprar mas boletos de los existentes, esto paso por que alguien fue mas rapido que tu");
          }else{
            alert("Fallo");
          }
        }else{
          alert('Esta Rifa no es para tu region');
        }
      }else{
        alert('Para participar debes activar la geolocalización en tu navegador o ver si la soporta, si no cambia de navegador a uno mas reciente');
      }
    };
    $scope.deleteRifa = function(){
      //console.log($scope.channel.selected.$id);
      if(confirm("Desea continuar con la eliminación de la rifa?")){
        $scope._rifasRef.child($scope.channel.selected.$id).set(null);
        $scope._participantsRef.child($scope.channel.selected.$id).set(null);
        $scope._ticketsRef.child($scope.channel.selected.$id).set(null);
        $scope.rifa.create=false;
        $scope.rifa.active=false;
        $scope.rifa.pregunta=false;
        $scope.rifa.rifa=false;
        $scope.rifa.art.cant=0;
        $scope.rifa.art.cantComprados=0;
        $scope.rifa.art.cantUser=0;
        $scope.rifa.art.imgUrl=null;
        $scope.rifa.art.nomArt=null;
        $scope.rifa.art.precioBole=0;
        $scope.rifa.art.userIdG=null;
        $scope.rifa.art.userIdGname=null;
        $scope.rifa.art.userIdGname_slug=null;
        $scope.rifa.art.userIdGemail=null;
        $scope.rifa.art.stop=false;
        $scope.rifa.art.countrys=null;
        $scope.rifa.art.citys=null;
        $scope.rifa.art.go=false;
        $scope.rifa.user.cant=1;
      }

    };
    $scope.createRifa = function() {
      var modalInstance = $uibModal.open({
        templateUrl: '/js/partials/create-rifa.html',
        controller: 'RifaController',
        size: 'lg',
        resolve: {
          Items: function() //scope del modal
            {
                return $scope;
            }
        }
      });

      modalInstance.result.then(function() {}, function() {
        //$log.info('Modal dismissed at: ' + new Date());
      });
    };
    $scope.getMentionable = function() {
      var new_people = [];

      angular.forEach($scope.members, function(member) {
        new_people.push({'label': member.username});
      })
      $scope.people = new_people;
    }

    $scope.goToBottom = function() {
      var mh_window = $('.message-history');
      if(mh_window[0]) {
        mh_window.scrollTop(mh_window[0].scrollHeight);
      }
      $scope.old_messages = [];
      $scope.scroll_help.scrolledUp = false;
    }

    $scope.changeChannel = function(channel) {
      if($scope.channel.selected == channel) return;

      if($scope.channel.selected != null) {
        $scope.exitChannel();
      }
      $scope.channel.selected = channel;
      $location.path('/chat/' + channel.slug);

      var messagesRef = $scope._messageRef.child(channel.$id).orderByChild('created_at').limitToLast(50);

      if($scope.channel.selected.fullscreen) {
        $scope.channel.selected.new_yt_code = $scope.channel.selected.fullscreen.video;
      } else {
        $scope.channel.selected.new_yt_code = "";
      }
      $scope.messages = $firebaseArray( messagesRef );

      // When messages are loaded on UI and also when a new message arrives
      $scope.messages.$loaded().then(function(x) {
        $timeout(function() {
          var mh_window = $('.message-history');
          if(mh_window[0]) {
            mh_window.scrollTop(mh_window[0].scrollHeight);
          }
        }, 200);

        x.$watch(function(event) {
          if(event.event === "child_added") {
            if(!$scope.scroll_help.scrolledUp) {
              $timeout(function() {
                var mh_window = $('.message-history');
                if(mh_window[0]) {
                  mh_window.scrollTop(mh_window[0].scrollHeight);
                }
              }, 200);
            }
          }
        });
      });

      messagesRef.on('child_removed', function(dataSnapshot) {
        if($scope.scroll_help.scrolledUp) {
          $scope.old_messages = $scope.old_messages.concat( dataSnapshot.val() );
        } else {
          $scope.old_messages = [];
        }
      });

      var membersRef = new Firebase(firebase_url + 'members/' + channel.$id);
      $scope.members = $firebaseArray(membersRef);
      membersRef.on('value', function(snapshot) {
        var new_people = [];
        snapshot.forEach(function(childSnapshot) {
          new_people.push({'label': childSnapshot.val().username});
        });
        $scope.people = new_people;
      });

      // Some status validation if user is logged in
      if($scope.user.isLogged) {
        $scope.promises.self.then(function() {
          var amOnline = new Firebase(firebase_url + '.info/connected');
          $scope._statusRef = new Firebase(firebase_url + 'members/' + channel.$id + '/' + $scope.user.info.id);

          amOnline.on('value', function(snapshot) {
            if(snapshot.val()) {
              var image = $scope.user.info.image || "";
              $scope._statusRef.onDisconnect().remove();
              $scope._statusRef.on('value', function(ss) {
                if( ss.val() == null ) {
                  // another window went offline, so mark me still online
                  $scope._statusRef.set({
                    id: $scope.user.info.id,
                    username: $scope.user.info.username,
                    image: image,
                    writing: false
                  });
                }
              });
            }
          });
        });
        //updates for rifas
        var firebaseRefR = $scope._rifasRef.child(channel.$id);
        var firebaseRefRPart = $scope._participantsRef.child(channel.$id).child($scope.user.info.id);
        var firebaseRefRTickets = $scope._ticketsRef.child(channel.$id);
        var firebaseRefRPartAdmin = $scope._participantsRef.child(channel.$id);
        firebaseRefR.on("value", function(snapshot) {
          //console.log(snapshot.val());
          if(snapshot.val()==null){
            //$scope.safeApply(function(){
            $timeout(function(){
              $scope.rifa.create=false;
              $scope.rifa.active=false;
              $scope.rifa.pregunta=false;
              $scope.rifa.rifa=false;
              $scope.rifa.art.cant=0;
              //$scope.rifa.art.cantComprados=0;
              $scope.rifa.art.cantUser=0;
              $scope.rifa.art.imgUrl=null;
              $scope.rifa.art.nomArt=null;
              $scope.rifa.art.precioBole=0;
              $scope.rifa.art.userIdG=null;
              $scope.rifa.art.userIdGname=null;
              $scope.rifa.art.userIdGname_slug=null;
              $scope.rifa.art.userIdGemail=null;
              $scope.rifa.art.stop=false;
              $scope.rifa.art.countrys=null;
              $scope.rifa.art.citys=null;
              $scope.rifa.art.go=false;
              $scope.rifa.user.cant=1;
            });
            //});
          }else{
            //$scope.safeApply(function(){
            $timeout(function(){
              $scope.rifa.create=true;
              $scope.rifa.active=true;
              $scope.rifa.rifa=true;
              $scope._participantsRef.child($scope.channel.selected.$id).child($scope.user.info.id)
              .once('value', function(snapshott) {
                if(snapshott.val()==null){
                  $scope.rifa.pregunta=true;
                }else{
                  $scope.rifa.pregunta=false;
                }
              }, function (errorObject) {
                console.log("The read failed: " + errorObject.code);
              });
              $scope.rifa.art.cant=snapshot.val().cant;
              $scope.rifa.art.cantUser=snapshot.val().cantUser;
              $scope.rifa.art.imgUrl=snapshot.val().imgUrl;
              $scope.rifa.art.nomArt=snapshot.val().nomArt;
              $scope.rifa.art.precioBole=snapshot.val().precioBole;
              //$scope.rifa.art.cantComprados=snapshot.val().cantComprados;
              $scope.rifa.art.userIdG=snapshot.val().userIdG;
              $scope.rifa.art.userIdGname=snapshot.val().userIdGname;
              $scope.rifa.art.userIdGname_slug=snapshot.val().userIdGname_slug;
              $scope.rifa.art.userIdGemail=snapshot.val().userIdGemail;
              $scope.rifa.art.stop=snapshot.val().stop;
              $scope.rifa.art.countrys=snapshot.val().countrys;
              $scope.rifa.art.citys=snapshot.val().citys;
              $scope.rifa.art.go=snapshot.val().go;
            });
          }
        }, function (errorObject) {
          console.log("The read failed: " + errorObject.code);
        });
        firebaseRefRPart.on("value", function(snapshot) {
          //console.log(snapshot.val());
          if(snapshot.val()==null){
            $scope.rifa.pregunta=true;
            $scope.rifa.user.cant=1;
            $scope.rifa.user.userid=$scope.user.info.id;
            $scope.rifa.user.username=$scope.user.info.username;
            $scope.rifa.user.username_slug=$scope.user.info.username_slug;
            $scope.rifa.user.email=$scope.user.info.email;
            $scope.rifa.user.ticketskey=null;
          }else{
            $scope.rifa.pregunta=false;
            $scope.rifa.user={
              cant:snapshot.val().cant,
              userid:snapshot.val().userid,
              username:snapshot.val().username,
              username_slug:snapshot.val().username_slug,
              email:snapshot.val().email,
              ticketskey:snapshot.val().ticketskey
            };
          }
        }, function (errorObject) {
          console.log("The read failed: " + errorObject.code);
        });
        firebaseRefRTickets.on("value", function(snapshot) {
          //console.log(snapshot.val().length);
          if(snapshot.val()==null){
            $timeout(function(){
              $scope.rifa.art.cantComprados=0;
            });
          }else{
            var count = Object.keys(snapshot.val()).length;
            $timeout(function(){
              $scope.rifa.art.cantComprados=count;
            });
          }
        }, function (errorObject) {
          console.log("The read failed: " + errorObject.code);
        });
        if($scope.can('board-config')){
          firebaseRefRTickets.on("value", function(snapshot) {
            if(snapshot.val()==null){
              firebaseRefR.once("value", function(snapshott){
                if(snapshott.val()!=null){
                  $scope.updateRifa();    
                }
              }, function(errorObjectt){
                console.log("The read failed: " + errorObjectt.code);
              });
            }else{
              $scope.updateRifa();
            }
          }, function (errorObject) {
            console.log("The read failed: " + errorObject.code);
          });
        }
      }
    };

    $scope.exitChannel = function() {
      if($scope.channel.selected) {
        channel = $scope.channel.selected;
        if($scope.user.isLogged) {
          if($scope._statusRef) {
            $scope._statusRef.off();
            $scope._statusRef.set(null);
          }
        }
      }
    };

    $scope.updateChannelMeta = function(){
      if($scope.channel.selected.new_yt_code == "") {
        $scope.channel.selected.fullscreen = null;
      } else {
        if(!$scope.channel.selected.fullscreen) {
          $scope.channel.selected.fullscreen = {
            video: null
          };
        }
        $scope.channel.selected.fullscreen.video = $scope.channel.selected.new_yt_code;
      }
      $scope.channels.$save($scope.channel.selected);
    }

    $scope.addMessage = function() {
      if($scope.message.content && ($scope.message.content.length <= $scope._options.messagesLength && $scope.message.content.length > 0)) {
        // If message is contained in previous message, or viceversa, or they're the same...
        if($scope.message.content === $scope.message.previous || ($scope.message.previous.indexOf($scope.message.content) > -1) || ($scope.message.content.indexOf($scope.message.previous) > -1)) {

          $scope.helpers.spam_count++;
        } else {
          if($scope.helpers.spam_count > 0) {
            $scope.helpers.spam_count--;
          }
        }

        if($scope.helpers.spam_count > 2) {
          $('.input-box_text').blur();
          if($scope._userRef) {
            $scope._userRef.child('chat/blocked').set(true);
          }
          $scope.helpers.spam_count = 0;
          $scope.message.content = '';
        } else {
          $scope.message.previous = $scope.message.content;

          if($scope.message.content !== '') {
            var image = $scope.user.info.image || "";
            var new_message = {
              author: {
                id: $scope.user.info.id,
                username: $scope.user.info.username,
                image: image
              },
              content: $scope.message.content,
              created_at: Firebase.ServerValue.TIMESTAMP
            };
            if($scope.message.highlight) {
              new_message.highlight = true;
            }
            //console.log(new_message);
            $scope.messages.$add(new_message).then(function(ref) {
              $scope.message.content = '';
              $scope.emojiMessage = {};
            });
          }
        }
      }
    }

    $scope.addMessageNew = function($event) {
      if($event.which === 13 && $scope.message.send_on_enter) {
        $timeout(function(){
          $scope.addMessage();
          $timeout.cancel($scope.helpers.writing_timeout);
          $scope._statusRef.child('writing').set(false);
          $scope.helpers.writing = false;
          $event.preventDefault();
        }, 0);
      } else {
        if(!$scope.helpers.writing) {
          $scope._statusRef.child('writing').set(true);
          $scope.helpers.writing = true;
        }
        if($scope.helpers.writing_timeout) $timeout.cancel($scope.helpers.writing_timeout);
        $scope.helpers.writing_timeout = $timeout(function() {
          $scope._statusRef.child('writing').set(false);
          $scope.helpers.writing = false;
        }, 1000); // delay in ms
      }
    }

    $scope.removeMessage = function(message) {
      $scope.messages.$remove(message).then(function(ref) {
        console.log(ref.key() === message.$id); // true
      });
    }

    $scope.toggle_details = function() {
      $scope.show_details = !$scope.show_details;
    }

    $scope.suspendUser = function(userId, timeLengthSeconds) {
      //var suspendedUntil = new Date().getTime() + 1000*timeLengthSeconds;

      $scope._suspensionsRef.child(userId).set(true, function(error) {
        if (error) {
          console.log("error in user ban")
        } else {
          console.log("user was banned")
        }
      });
    };

    $scope.channels = $firebaseArray($scope._channelRef);
    $scope.channels.$loaded().then(function() {
      if($routeParams.slug != undefined) {
        var found = false;
        for(i in $scope.channels) {
          if($scope.channels[i].slug == $routeParams.slug) {
            $scope.changeChannel($scope.channels[i]);
            found = true;
            break;
          }
        }
        if(!found) {
          $scope.changeChannel($scope.channels[0]);
        }
      } else {
        $scope.changeChannel($scope.channels[0]);
      }
    });

    $scope.checkValidation = function() {
      if($scope.user.isLogged) {
        $scope.promises.self.then(function(){

          $scope._userRef = $scope._firebase.child("users").child($scope.user.info.id);

          $scope._userRef.child('validated').once('value', function(ss) {
            if(ss.val() == true) {
              $scope.helpers.validated = true;
            }
          });

          $scope._userRef.child('chat/blocked').on('value', function(ss) {
            if(ss.val() == true) {
              $scope.helpers.blocked = true;
              $timeout(function(){
                $scope._userRef.child('chat/blocked').set(null);
                $scope.helpers.blocked = false;
              }, 60000);
            }
          });

        });
      }
    };
    $scope.checkValidation();

    $scope.$on("userLogged", function() {
      $scope.checkValidation();
    });

    $scope.$on("$destroy", function() {
      if($scope.can('debug')) console.log("Closing chat");
      $scope.exitChannel();
    });

    // Scrolling responses
    $scope.scroll_help = {
      lastScrollTop: 0,
      from_top: 0,
      max_height: 0,
      last_height: 0,
      scrolledUp: false
    }

    jQuery('.message-history').scroll(function() {
      $scope.scroll_help.from_top = $(this).scrollTop();
      $scope.scroll_help.max_height = $(this)[0].scrollHeight - $(this).height();

      // If scrolling further than possible... (happens because of some OS effects)
      if($scope.scroll_help.from_top > $scope.scroll_help.max_height) {
        $scope.scroll_help.from_top = $scope.scroll_help.max_height; // we "saturate" from_top distance
      }

      if ($scope.scroll_help.from_top >= $scope.scroll_help.lastScrollTop) {
        // downscroll code
        //if($scope.can('debug')) console.log("Scrolling downward");
        if($scope.scroll_help.from_top == $scope.scroll_help.max_height) {
          $scope.scroll_help.scrolledUp = false;
          $scope.old_messages = [];
        }
      } else {
        //if($scope.can('debug')) console.log("Scrolling upward");
        if($scope.scroll_help.last_height <= $scope.scroll_help.max_height) {
          // upscroll code
          $scope.scroll_help.scrolledUp = true;
        }
      }
      $scope.scroll_help.lastScrollTop = $scope.scroll_help.from_top;
      $scope.scroll_help.last_height = $scope.scroll_help.max_height;
    });

    // Hack, so we don't have to reload the controller if the route uses the same controller
    var lastRoute = $route.current;
    $scope.$on('$locationChangeSuccess', function(event) {
      if(lastRoute.$$route.controller === $route.current.$$route.controller) {
        // Will not load only if my view use the same controller
        // We recover new params
        new_params = $route.current.params;
        $route.current = lastRoute;
        $route.current.params = new_params;
      }
    });
  }
];
var RifaController = [
  '$scope',
  '$firebaseArray',
  '$firebaseObject',
  '$modalInstance',
  'Items',
  '$http',
  'Upload',
  function($scope, $firebaseArray, $firebaseObject, $modalInstance, Items, $http ,Upload) {
    $scope.countrysarr={
      model: null,
      availableOptions: [
        {value: 'Argentina', name: 'Argentina'},
        {value: 'Belice', name: 'Belice'},
        {value: 'Bolivia', name: 'Bolivia'},
        {value: 'Brasil', name: 'Brasil'},
        {value: 'Canad\u00e1', name: 'Canad\u00e1'},
        {value: 'Costa Rica', name: 'Costa Rica'},
        {value: 'Colombia', name: 'Colombia'},
        {value: 'Cuba', name: 'Cuba'},
        {value: 'Ecuador', name: 'Ecuador'},        
        {value: 'Estados Unidos', name: 'Estados Unidos'},
        {value: 'El Salvador', name: 'El Salvador'},
        {value: 'Guatemala', name: 'Guatemala'},
        {value: 'Guyana', name: 'Guyana'},
        {value: 'Honduras', name: 'Honduras'},
        {value: 'M\u00e9xico', name: 'M\u00e9xico'},
        {value: 'Nicaragua', name: 'Nicaragua'},
        {value: 'Panam\u00e1', name: 'Panam\u00e1'},
        {value: 'Per\u00fa', name: 'Per\u00fa'},
        {value: 'Paraguay', name: 'Paraguay'},
        {value: 'Surinam', name: 'Surinam'},
        {value: 'Uruguay', name: 'Uruguay'},
        {value: 'Venezuela', name: 'Venezuela'}        
      ]
    };
    $scope.countrys={
      "CA":"Canad\u00e1",
      "MX":"M\u00e9xico",
      "US":"Estados Unidos",
      "BZ":"Belice",
      "GT":"Guatemala",
      "CR":"Costa Rica",
      "HN":"Honduras",
      "SV":"El Salvador",
      "NI":"Nicaragua",
      "PA":"Panam\u00e1",
      "CU":"Cuba",
      "AR":"Argentina",
      "BO":"Bolivia",
      "BR":"Brasil",
      "CL":"Chile",
      "CO":"Colombia",
      "EC":"Ecuador",
      "PE":"Per\u00fa",
      "PY":"Paraguay",
      "UY":"Uruguay",
      "VE":"Venezuela",
      "GY":"Guyana",
      "SR":"Surinam"
    };
    $scope.citysarr={
      model: null,
      availableOptions: [
        {value: 'Aguascalientes', name: 'Aguascalientes'},
        {value: 'Baja California', name: 'Baja California'},
        {value: 'Baja California Sur', name: 'Baja California Sur'},
        {value: 'Campeche', name: 'Campeche'},
        {value: 'Chiapas', name: 'Chiapas'},
        {value: 'Chihuahua', name: 'Chihuahua'},
        {value: 'Coahuila', name: 'Coahuila'},
        {value: 'Colima', name: 'Colima'},
        {value: 'Distrito Federal', name: 'Distrito Federal'},
        {value: 'Estado de México', name: 'Estado de México'},
        {value: 'Ciudad de México', name: 'Ciudad de México'},
        {value: 'CDMX', name: 'CDMX'},
        {value: 'Méx.', name: 'Méx.'},
        {value: 'Durango', name: 'Durango'},
        {value: 'Guanajuato', name: 'Guanajuato'},
        {value: 'Guerrero', name: 'Guerrero'},
        {value: 'Hidalgo', name: 'Hidalgo'},
        {value: 'Jalisco', name: 'Jalisco'},
        {value: 'México', name: 'México'},
        {value: 'Michoacán', name: 'Michoacán'},
        {value: 'Morelos', name: 'Morelos'},
        {value: 'Nayarit', name: 'Nayarit'},
        {value: 'Nuevo León', name: 'Nuevo León'},
        {value: 'Puebla', name: 'Puebla'},
        {value: 'Querétaro', name: 'Querétaro'},
        {value: 'Quintana Roo', name: 'Quintana Roo'},
        {value: 'San Luis Potosí', name: 'San Luis Potosí'},
        {value: 'Sinaloa', name: 'Sinaloa'},
        {value: 'Sonora', name: 'Sonora'},
        {value: 'Tabasco', name: 'Tabasco'},
        {value: 'Tamaulipas', name: 'Tamaulipas'},
        {value: 'Tlaxcala', name: 'Tlaxcala'},
        {value: 'Veracruz', name: 'Veracruz'},
        {value: 'Yucatán', name: 'Yucatán'},
        {value: 'Zacatecas', name: 'Zacatecas'}
      ]
    };
    $scope.citys={
      "ag":"Aguascalientes",
      "bc": "Baja California",
      "bs": "Baja California Sur",
      "cm": "Campeche",
      "cs": "Chiapas",
      "ch": "Chihuahua",
      "co": "Coahuila",
      "cl": "Colima",
      "df": "Distrito Federal",
      "edm": "Estado de México",
      "cme": "Ciudad de México",
      "cmx": "CDMX",
      "cm.": "Méx.",
      "dg": "Durango",
      "gt": "Guanajuato",
      "gr": "Guerrero",
      "hg": "Hidalgo",
      "ja": "Jalisco",
      "me": "México",
      "mi": "Michoacán",
      "mo": "Morelos",
      "na": "Nayarit",
      "nl": "Nuevo León",
      "oa": "Oaxaca",
      "pb": "Puebla",
      "qe": "Querétaro",
      "qr": "Quintana Roo",
      "sl": "San Luis Potosí",
      "si": "Sinaloa",
      "so": "Sonora",
      "tb": "Tabasco",
      "tm": "Tamaulipas",
      "tl": "Tlaxcala",
      "ve": "Veracruz",
      "yu": "Yucatán",
      "za": "Zacatecas"
    };
    $scope.items = Items;
    $scope.rifa = {
      chatId: $scope.items.channel.selected.$id,
      userId: $scope.items.user.info.id,
      cant: 0,
      cantUser: 0,
      cantComprados: 0,
      precioBole: 0.00,
      nomArt: "",
      imgUrl: "",
      userIdG: null,
      userIdGname: null,
      userIdGname_slug: null,
      userIdGemail: null,
      stop: false,
      countrys: null,
      citys: null,
      go: false
    };
    $scope.alert={
      msg:"",
      type:"success"
    };
    $scope.adding_img = false;
    var firebaseRef = new Firebase(firebase_url+'/raffles/'+$scope.items.channel.selected.$id);
    //var firebaseRefPart = new Firebase(firebase_url+'/participants');
    $scope.safeApply = function(fn) {
      var phase = this.$root.$$phase;
      if(phase == '$apply' || phase == '$digest') {
        if(fn && (typeof(fn) === 'function')) {
          fn();
        }
      } else {
        this.$apply(fn);
      }
    };
    $scope.save = function (){
      if($scope.rifa.cant===undefined || $scope.rifa.cant==null || $scope.rifa.cant<=0 || isNaN($scope.rifa.cantUser) || $scope.rifa.cant % 1 != 0){
        $scope.alert.msg="El campo Cantidad de boletos no puede estar vacio, menor o igual a cero y no numeros con fraccion";
        $scope.alert.type='warning';
        $scope.safeApply(function(){});
      }else if($scope.rifa.cantUser===undefined || $scope.rifa.cantUser==null || $scope.rifa.cantUser<=0 || isNaN($scope.rifa.cantUser) || $scope.rifa.cantUser % 1 != 0){
        $scope.alert.msg="El campo Cantidad de boletos por Usuario no puede estar vacio, menor o igual a cero y no numeros con fraccion";
        $scope.alert.type='warning';
        $scope.safeApply(function(){});
      }else if($scope.rifa.precioBole===undefined || $scope.rifa.precioBole==null || $scope.rifa.precioBole<0 || isNaN($scope.rifa.precioBole)){
        $scope.alert.msg="El campo Precio por boleto no puede estar vacio, recuerde solo 2 numeros despues del punto decimal";
        $scope.alert.type='warning';
        $scope.safeApply(function(){});
      }else if($scope.rifa.nomArt===undefined || $scope.rifa.nomArt==""){
        $scope.alert.msg="El campo Nombre del articulo no puede estar vacio";
        $scope.alert.type='warning';
        $scope.safeApply(function(){});
      }else if($scope.rifa.imgUrl===undefined || $scope.rifa.imgUrl==""){
        $scope.alert.msg="Aun no carga una imagen";
        $scope.alert.type='warning';
        $scope.safeApply(function(){});
      }else{
        var rifaChat = {
          userId: $scope.items.user.info.id,
          cant: $scope.rifa.cant,
          cantUser: $scope.rifa.cantUser,
          cantComprados: $scope.rifa.cantComprados,
          precioBole: $scope.rifa.precioBole,
          nomArt: $scope.rifa.nomArt,
          imgUrl: $scope.rifa.imgUrl,
          userIdG: null,
          userIdGname: null,
          userIdGname_slug: null,
          userIdGemail: null,
          stop: false,
          countrys: $scope.rifa.countrys,
          citys: $scope.rifa.citys,
          go: false
        }
        firebaseRef.set(rifaChat, function(error) {
          if(error){
            $scope.items.rifa.create=false;
            $scope.$apply(function(){
              $scope.alert.msg=error;
              $scope.alert.type='danger';
            });
          }else{
            $scope.items.rifa.create=true;
            $scope.$apply(function(){
              $scope.alert.msg='Creado correctamente';
              $scope.alert.type='success';
            });
          }
        });
      }
    };
    $scope.cancel = function (){
      $modalInstance.dismiss('cancel');
    };
    $scope.uploadPicture = function(files) {
      if(files.length == 1) {
        var file = files[0];
        $scope.adding_img = true;
        Upload.upload({
          url: layer_path + "post/image",
          file: file
        }).success(function (data) {
          if($scope.rifa.imgUrl.length > 0) {
            $scope.rifa.imgUrl += data.url;
          } else {
            $scope.rifa.imgUrl = data.url;
          }
          $scope.adding_img = false;
        }).error(function(data) {
          $scope.adding_img = false;
        });
      }
    };
  }
];

var enter=false;
var chatModule = angular.module('chatModule', ['firebase', 'ngSanitize']);

chatModule.controller('ChatController', ChatController);
chatModule.controller('RifaController', RifaController);

chatModule.directive('sgEnter', function() {
  return {
    link: function(scope, element, attrs){
      //console.log(scope.message.send_on_enter);
      element.bind("keyup", function(event) {
        if(enter==false && event.which === 13 && scope.message.send_on_enter) {
          scope.$apply(function(){
            scope.$eval(attrs.sgEnter, {'event': event});
          });
          event.preventDefault();
        }else if(enter==true){
          enter=false;
        }
      });
    }
  };
});

chatModule.directive('youtube', function($sce) {
  return {
    restrict: 'EA',
    scope: {
      code: '='
    },
    replace: true,
    template: '<div class="yt-video"><iframe style="overflow:hidden;height:100%;width:100%" width="100%" height="100%" src="{{url}}" frameborder="0" allowfullscreen></iframe></div>',
    link: function (scope) {
      scope.$watch('code', function (newVal) {
        if (newVal) {
          scope.url = $sce.trustAsResourceUrl("https://www.youtube.com/embed/" + newVal);
        }
      });
    }
  };
});

chatModule.directive('showImages', [function() {
  var urlPattern = /(http|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/gi;
  /*var regex = new RegExp("(https?:\/\/.*\\.(?:png|jpg|jpeg|gif)((\\?|\\&)[a-zA-Z0-9]+\\=[a-zA-Z0-9]+)*)", "gi");
  var to_replace = "<div class=\"img-preview\"><div class=\"url-text\">$1 <i class=\"fa fa-chevron-down\"></i><i class=\"fa fa-chevron-up\"></i></div><a href=\"$1\" target=\"_blank\" ng-show=\"show_image\"><img src=\"$1\"></a></div>";*/

  var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;'
  };

  function escapeHtml(string) {
    return String(string).replace(/[&<>"']/g, function (s) {
      return entityMap[s];
    });
  }

  var emojis = [
    "bowtie", "smile", "laughing", "blush", "smiley", "relaxed",
    "smirk", "heart_eyes", "kissing_heart", "kissing_closed_eyes", "flushed",
    "relieved", "satisfied", "grin", "wink", "stuck_out_tongue_winking_eye",
    "stuck_out_tongue_closed_eyes", "grinning", "kissing",
    "kissing_smiling_eyes", "stuck_out_tongue", "sleeping", "worried",
    "frowning", "anguished", "open_mouth", "grimacing", "confused", "hushed",
    "expressionless", "unamused", "sweat_smile", "sweat",
    "disappointed_relieved", "weary", "pensive", "disappointed", "confounded",
    "fearful", "cold_sweat", "persevere", "cry", "sob", "joy", "astonished",
    "scream", "neckbeard", "tired_face", "angry", "rage", "triumph", "sleepy",
    "yum", "mask", "sunglasses", "dizzy_face", "imp", "smiling_imp",
    "neutral_face", "no_mouth", "innocent", "alien", "yellow_heart",
    "blue_heart", "purple_heart", "heart", "green_heart", "broken_heart",
    "heartbeat", "heartpulse", "two_hearts", "revolving_hearts", "cupid",
    "sparkling_heart", "sparkles", "star", "star2", "dizzy", "boom",
    "collision", "anger", "exclamation", "question", "grey_exclamation",
    "grey_question", "zzz", "dash", "sweat_drops", "notes", "musical_note",
    "fire", "hankey", "poop", "shit", "\\+1", "thumbsup", "-1", "thumbsdown",
    "ok_hand", "punch", "facepunch", "fist", "v", "wave", "hand", "raised_hand",
    "open_hands", "point_up", "point_down", "point_left", "point_right",
    "raised_hands", "pray", "point_up_2", "clap", "muscle", "metal", "fu",
    "walking", "runner", "running", "couple", "family", "two_men_holding_hands",
    "two_women_holding_hands", "dancer", "dancers", "ok_woman", "no_good",
    "information_desk_person", "raising_hand", "bride_with_veil",
    "person_with_pouting_face", "person_frowning", "bow", "couplekiss",
    "couple_with_heart", "massage", "haircut", "nail_care", "boy", "girl",
    "woman", "man", "baby", "older_woman", "older_man",
    "person_with_blond_hair", "man_with_gua_pi_mao", "man_with_turban",
    "construction_worker", "cop", "angel", "princess", "smiley_cat",
    "smile_cat", "heart_eyes_cat", "kissing_cat", "smirk_cat", "scream_cat",
    "crying_cat_face", "joy_cat", "pouting_cat", "japanese_ogre",
    "japanese_goblin", "see_no_evil", "hear_no_evil", "speak_no_evil",
    "guardsman", "skull", "feet", "lips", "kiss", "droplet", "ear", "eyes",
    "nose", "tongue", "love_letter", "bust_in_silhouette",
    "busts_in_silhouette", "speech_balloon", "thought_balloon", "feelsgood",
    "finnadie", "goberserk", "godmode", "hurtrealbad", "rage1", "rage2",
    "rage3", "rage4", "suspect", "trollface", "sunny", "umbrella", "cloud",
    "snowflake", "snowman", "zap", "cyclone", "foggy", "ocean", "cat", "dog",
    "mouse", "hamster", "rabbit", "wolf", "frog", "tiger", "koala", "bear",
    "pig", "pig_nose", "cow", "boar", "monkey_face", "monkey", "horse",
    "racehorse", "camel", "sheep", "elephant", "panda_face", "snake", "bird",
    "baby_chick", "hatched_chick", "hatching_chick", "chicken", "penguin",
    "turtle", "bug", "honeybee", "ant", "beetle", "snail", "octopus",
    "tropical_fish", "fish", "whale", "whale2", "dolphin", "cow2", "ram", "rat",
    "water_buffalo", "tiger2", "rabbit2", "dragon", "goat", "rooster", "dog2",
    "pig2", "mouse2", "ox", "dragon_face", "blowfish", "crocodile",
    "dromedary_camel", "leopard", "cat2", "poodle", "paw_prints", "bouquet",
    "cherry_blossom", "tulip", "four_leaf_clover", "rose", "sunflower",
    "hibiscus", "maple_leaf", "leaves", "fallen_leaf", "herb", "mushroom",
    "cactus", "palm_tree", "evergreen_tree", "deciduous_tree", "chestnut",
    "seedling", "blossom", "ear_of_rice", "shell", "globe_with_meridians",
    "sun_with_face", "full_moon_with_face", "new_moon_with_face", "new_moon",
    "waxing_crescent_moon", "first_quarter_moon", "waxing_gibbous_moon",
    "full_moon", "waning_gibbous_moon", "last_quarter_moon",
    "waning_crescent_moon", "last_quarter_moon_with_face",
    "first_quarter_moon_with_face", "moon", "earth_africa", "earth_americas",
    "earth_asia", "volcano", "milky_way", "partly_sunny", "octocat", "squirrel",
    "bamboo", "gift_heart", "dolls", "school_satchel", "mortar_board", "flags",
    "fireworks", "sparkler", "wind_chime", "rice_scene", "jack_o_lantern",
    "ghost", "santa", "christmas_tree", "gift", "bell", "no_bell",
    "tanabata_tree", "tada", "confetti_ball", "balloon", "crystal_ball", "cd",
    "dvd", "floppy_disk", "camera", "video_camera", "movie_camera", "computer",
    "tv", "iphone", "phone", "telephone", "telephone_receiver", "pager", "fax",
    "minidisc", "vhs", "sound", "speaker", "mute", "loudspeaker", "mega",
    "hourglass", "hourglass_flowing_sand", "alarm_clock", "watch", "radio",
    "satellite", "loop", "mag", "mag_right", "unlock", "lock",
    "lock_with_ink_pen", "closed_lock_with_key", "key", "bulb", "flashlight",
    "high_brightness", "low_brightness", "electric_plug", "battery", "calling",
    "email", "mailbox", "postbox", "bath", "bathtub", "shower", "toilet",
    "wrench", "nut_and_bolt", "hammer", "seat", "moneybag", "yen", "dollar",
    "pound", "euro", "credit_card", "money_with_wings", "e-mail", "inbox_tray",
    "outbox_tray", "envelope", "incoming_envelope", "postal_horn",
    "mailbox_closed", "mailbox_with_mail", "mailbox_with_no_mail", "door",
    "smoking", "bomb", "gun", "hocho", "pill", "syringe", "page_facing_up",
    "page_with_curl", "bookmark_tabs", "bar_chart", "chart_with_upwards_trend",
    "chart_with_downwards_trend", "scroll", "clipboard", "calendar", "date",
    "card_index", "file_folder", "open_file_folder", "scissors", "pushpin",
    "paperclip", "black_nib", "pencil2", "straight_ruler", "triangular_ruler",
    "closed_book", "green_book", "blue_book", "orange_book", "notebook",
    "notebook_with_decorative_cover", "ledger", "books", "bookmark",
    "name_badge", "microscope", "telescope", "newspaper", "football",
    "basketball", "soccer", "baseball", "tennis", "8ball", "rugby_football",
    "bowling", "golf", "mountain_bicyclist", "bicyclist", "horse_racing",
    "snowboarder", "swimmer", "surfer", "ski", "spades", "hearts", "clubs",
    "diamonds", "gem", "ring", "trophy", "musical_score", "musical_keyboard",
    "violin", "space_invader", "video_game", "black_joker",
    "flower_playing_cards", "game_die", "dart", "mahjong", "clapper", "memo",
    "pencil", "book", "art", "microphone", "headphones", "trumpet", "saxophone",
    "guitar", "shoe", "sandal", "high_heel", "lipstick", "boot", "shirt",
    "tshirt", "necktie", "womans_clothes", "dress", "running_shirt_with_sash",
    "jeans", "kimono", "bikini", "ribbon", "tophat", "crown", "womans_hat",
    "mans_shoe", "closed_umbrella", "briefcase", "handbag", "pouch", "purse",
    "eyeglasses", "fishing_pole_and_fish", "coffee", "tea", "sake",
    "baby_bottle", "beer", "beers", "cocktail", "tropical_drink", "wine_glass",
    "fork_and_knife", "pizza", "hamburger", "fries", "poultry_leg",
    "meat_on_bone", "spaghetti", "curry", "fried_shrimp", "bento", "sushi",
    "fish_cake", "rice_ball", "rice_cracker", "rice", "ramen", "stew", "oden",
    "dango", "egg", "bread", "doughnut", "custard", "icecream", "ice_cream",
    "shaved_ice", "birthday", "cake", "cookie", "chocolate_bar", "candy",
    "lollipop", "honey_pot", "apple", "green_apple", "tangerine", "lemon",
    "cherries", "grapes", "watermelon", "strawberry", "peach", "melon",
    "banana", "pear", "pineapple", "sweet_potato", "eggplant", "tomato", "corn",
    "house", "house_with_garden", "school", "office", "post_office", "hospital",
    "bank", "convenience_store", "love_hotel", "hotel", "wedding", "church",
    "department_store", "european_post_office", "city_sunrise", "city_sunset",
    "japanese_castle", "european_castle", "tent", "factory", "tokyo_tower",
    "japan", "mount_fuji", "sunrise_over_mountains", "sunrise", "stars",
    "statue_of_liberty", "bridge_at_night", "carousel_horse", "rainbow",
    "ferris_wheel", "fountain", "roller_coaster", "ship", "speedboat", "boat",
    "sailboat", "rowboat", "anchor", "rocket", "airplane", "helicopter",
    "steam_locomotive", "tram", "mountain_railway", "bike", "aerial_tramway",
    "suspension_railway", "mountain_cableway", "tractor", "blue_car",
    "oncoming_automobile", "car", "red_car", "taxi", "oncoming_taxi",
    "articulated_lorry", "bus", "oncoming_bus", "rotating_light", "police_car",
    "oncoming_police_car", "fire_engine", "ambulance", "minibus", "truck",
    "train", "station", "train2", "bullettrain_front", "bullettrain_side",
    "light_rail", "monorail", "railway_car", "trolleybus", "ticket", "fuelpump",
    "vertical_traffic_light", "traffic_light", "warning", "construction",
    "beginner", "atm", "slot_machine", "busstop", "barber", "hotsprings",
    "checkered_flag", "crossed_flags", "izakaya_lantern", "moyai",
    "circus_tent", "performing_arts", "round_pushpin",
    "triangular_flag_on_post", "jp", "kr", "cn", "us", "fr", "es", "it", "ru",
    "gb", "uk", "de", "one", "two", "three", "four", "five", "six", "seven",
    "eight", "nine", "keycap_ten", "1234", "zero", "hash", "symbols",
    "arrow_backward", "arrow_down", "arrow_forward", "arrow_left",
    "capital_abcd", "abcd", "abc", "arrow_lower_left", "arrow_lower_right",
    "arrow_right", "arrow_up", "arrow_upper_left", "arrow_upper_right",
    "arrow_double_down", "arrow_double_up", "arrow_down_small",
    "arrow_heading_down", "arrow_heading_up", "leftwards_arrow_with_hook",
    "arrow_right_hook", "left_right_arrow", "arrow_up_down", "arrow_up_small",
    "arrows_clockwise", "arrows_counterclockwise", "rewind", "fast_forward",
    "information_source", "ok", "twisted_rightwards_arrows", "repeat",
    "repeat_one", "new", "top", "up", "cool", "free", "ng", "cinema", "koko",
    "signal_strength", "u5272", "u5408", "u55b6", "u6307", "u6708", "u6709",
    "u6e80", "u7121", "u7533", "u7a7a", "u7981", "sa", "restroom", "mens",
    "womens", "baby_symbol", "no_smoking", "parking", "wheelchair", "metro",
    "baggage_claim", "accept", "wc", "potable_water", "put_litter_in_its_place",
    "secret", "congratulations", "m", "passport_control", "left_luggage",
    "customs", "ideograph_advantage", "cl", "sos", "id", "no_entry_sign",
    "underage", "no_mobile_phones", "do_not_litter", "non-potable_water",
    "no_bicycles", "no_pedestrians", "children_crossing", "no_entry",
    "eight_spoked_asterisk", "eight_pointed_black_star", "heart_decoration",
    "vs", "vibration_mode", "mobile_phone_off", "chart", "currency_exchange",
    "aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpius",
    "sagittarius", "capricorn", "aquarius", "pisces", "ophiuchus",
    "six_pointed_star", "negative_squared_cross_mark", "a", "b", "ab", "o2",
    "diamond_shape_with_a_dot_inside", "recycle", "end", "on", "soon", "clock1",
    "clock130", "clock10", "clock1030", "clock11", "clock1130", "clock12",
    "clock1230", "clock2", "clock230", "clock3", "clock330", "clock4",
    "clock430", "clock5", "clock530", "clock6", "clock630", "clock7",
    "clock730", "clock8", "clock830", "clock9", "clock930", "heavy_dollar_sign",
    "copyright", "registered", "tm", "x", "heavy_exclamation_mark", "bangbang",
    "interrobang", "o", "heavy_multiplication_x", "heavy_plus_sign",
    "heavy_minus_sign", "heavy_division_sign", "white_flower", "100",
    "heavy_check_mark", "ballot_box_with_check", "radio_button", "link",
    "curly_loop", "wavy_dash", "part_alternation_mark", "trident",
    "black_square", "white_square", "white_check_mark", "black_square_button",
    "white_square_button", "black_circle", "white_circle", "red_circle",
    "large_blue_circle", "large_blue_diamond", "large_orange_diamond",
    "small_blue_diamond", "small_orange_diamond", "small_red_triangle",
    "small_red_triangle_down", "shipit"
  ],
  rEmojis = new RegExp(":(" + emojis.join("|") + "):", "g");

  return {
    restrict: 'A',
    scope: {
      'content' : '@',
      'username' : '@'
    },
    replace: true,
    link: function (scope, element, attrs, controller) {
      var usernamePattern = new RegExp("(\@" + scope.username + ")", "gi");
      var unReplace = "<span class=\"mention\">$1</span>"

      //scope.$watch('content', function (value) {
        var text = escapeHtml(scope.content);
        /*scope.show_image = false;
        var images = text.replace(regex, to_replace);*/
        var new_text = text.replace(urlPattern, '<a target="_blank" href="$&">$&</a>');
        new_text = new_text.replace(rEmojis, function (match, text) {
                return "<i class='emoji emoji_" + text + "' title=':" + text + ":'>" + text + "</i>";
            });
        if(scope.username) {
          new_text = new_text.replace(usernamePattern, unReplace);
        }
        element.html(new_text);
      //});
    }
  };
}]);