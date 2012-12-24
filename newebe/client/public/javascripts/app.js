(function(/*! Brunch !*/) {
  'use strict';

  var globals = typeof window !== 'undefined' ? window : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};

  var has = function(object, name) {
    return ({}).hasOwnProperty.call(object, name);
  };

  var expand = function(root, name) {
    var results = [], parts, part;
    if (/^\.\.?(\/|$)/.test(name)) {
      parts = [root, name].join('/').split('/');
    } else {
      parts = name.split('/');
    }
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      var dir = dirname(path);
      var absolute = expand(dir, name);
      return globals.require(absolute);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    definition(module.exports, localRequire(name), module);
    var exports = cache[name] = module.exports;
    return exports;
  };

  var require = function(name) {
    var path = expand(name, '.');

    if (has(cache, path)) return cache[path];
    if (has(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has(cache, dirIndex)) return cache[dirIndex];
    if (has(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '"');
  };

  var define = function(bundle) {
    for (var key in bundle) {
      if (has(bundle, key)) {
        modules[key] = bundle[key];
      }
    }
  }

  globals.require = require;
  globals.require.define = define;
  globals.require.brunch = true;
})();

window.require.define({"initialize": function(exports, require, module) {
  var _ref, _ref1, _ref2, _ref3, _ref4;

  if ((_ref = this.Newebe) == null) {
    this.Newebe = {};
  }

  if ((_ref1 = Newebe.routers) == null) {
    Newebe.routers = {};
  }

  if ((_ref2 = Newebe.views) == null) {
    Newebe.views = {};
  }

  if ((_ref3 = Newebe.models) == null) {
    Newebe.models = {};
  }

  if ((_ref4 = Newebe.collections) == null) {
    Newebe.collections = {};
  }

  $(function() {
    var AppView;
    require('../lib/app_helpers');
    Newebe.views.appView = new (AppView = require('views/app_view'));
    Newebe.views.appView.render();
    Newebe.views.appView.checkUserState();
    return Backbone.history.start({
      pushState: true
    });
  });
  
}});

window.require.define({"lib/app_helpers": function(exports, require, module) {
  
  (function() {
    return (function() {
      var console, dummy, method, methods, _results;
      console = window.console = window.console || {};
      method = void 0;
      dummy = function() {};
      methods = 'assert,count,debug,dir,dirxml,error,exception,\
                     group,groupCollapsed,groupEnd,info,log,markTimeline,\
                     profile,profileEnd,time,timeEnd,trace,warn'.split(',');
      _results = [];
      while (method = methods.pop()) {
        _results.push(console[method] = console[method] || dummy);
      }
      return _results;
    })();
  })();
  
}});

window.require.define({"lib/request": function(exports, require, module) {
  
  exports.request = function(type, url, data, callback) {
    return $.ajax({
      type: type,
      url: url,
      data: data != null ? JSON.stringify(data) : null,
      contentType: "application/json",
      dataType: "json",
      success: function(data) {
        if (callback != null) {
          return callback(null, data);
        }
      },
      error: function() {
        if ((data.msg != null) && (callback != null)) {
          return callback(new Error(data.msg));
        } else if (callback != null) {
          return callback(new Error("Server error occured"));
        }
      }
    });
  };

  exports.get = function(url, callbacks) {
    return exports.request("GET", url, null, callbacks);
  };

  exports.post = function(url, data, callbacks) {
    return exports.request("POST", url, data, callbacks);
  };

  exports.put = function(url, data, callbacks) {
    return exports.request("PUT", url, data, callbacks);
  };

  exports.del = function(url, callbacks) {
    return exports.request("DELETE", url, null, callbacks);
  };
  
}});

window.require.define({"lib/view": function(exports, require, module) {
  var View,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = View = (function(_super) {

    __extends(View, _super);

    function View() {
      return View.__super__.constructor.apply(this, arguments);
    }

    View.prototype.tagName = 'div';

    View.prototype.template = function() {};

    View.prototype.initialize = function() {
      return this.render();
    };

    View.prototype.getRenderData = function() {
      var _ref;
      return {
        model: (_ref = this.model) != null ? _ref.toJSON() : void 0
      };
    };

    View.prototype.render = function() {
      this.beforeRender();
      this.$el.html(this.template()(this.getRenderData()));
      this.afterRender();
      return this;
    };

    View.prototype.beforeRender = function() {};

    View.prototype.afterRender = function() {};

    View.prototype.destroy = function() {
      this.undelegateEvents();
      this.$el.removeData().unbind();
      this.remove();
      return Backbone.View.prototype.remove.call(this);
    };

    return View;

  })(Backbone.View);
  
}});

window.require.define({"lib/view_collection": function(exports, require, module) {
  var View, ViewCollection, methods,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  View = require('./view');

  ViewCollection = (function(_super) {

    __extends(ViewCollection, _super);

    function ViewCollection() {
      this.renderAll = __bind(this.renderAll, this);

      this.renderOne = __bind(this.renderOne, this);
      return ViewCollection.__super__.constructor.apply(this, arguments);
    }

    ViewCollection.prototype.collection = new Backbone.Collection();

    ViewCollection.prototype.view = new View();

    ViewCollection.prototype.views = [];

    ViewCollection.prototype.length = function() {
      return this.views.length;
    };

    ViewCollection.prototype.add = function(views, options) {
      var view, _i, _len;
      if (options == null) {
        options = {};
      }
      views = _.isArray(views) ? views.slice() : [views];
      for (_i = 0, _len = views.length; _i < _len; _i++) {
        view = views[_i];
        if (!this.get(view.cid)) {
          this.views.push(view);
          if (!options.silent) {
            this.trigger('add', view, this);
          }
        }
      }
      return this;
    };

    ViewCollection.prototype.get = function(cid) {
      return this.find(function(view) {
        return view.cid === cid;
      }) || null;
    };

    ViewCollection.prototype.remove = function(views, options) {
      var view, _i, _len;
      if (options == null) {
        options = {};
      }
      views = _.isArray(views) ? views.slice() : [views];
      for (_i = 0, _len = views.length; _i < _len; _i++) {
        view = views[_i];
        this.destroy(view);
        if (!options.silent) {
          this.trigger('remove', view, this);
        }
      }
      return this;
    };

    ViewCollection.prototype.destroy = function(view, options) {
      var _views;
      if (view == null) {
        view = this;
      }
      if (options == null) {
        options = {};
      }
      _views = this.filter(_view)(function() {
        return view.cid !== _view.cid;
      });
      this.views = _views;
      view.undelegateEvents();
      view.$el.removeData().unbind();
      view.remove();
      Backbone.View.prototype.remove.call(view);
      if (!options.silent) {
        this.trigger('remove', view, this);
      }
      return this;
    };

    ViewCollection.prototype.reset = function(views, options) {
      var view, _i, _j, _len, _len1, _ref;
      if (options == null) {
        options = {};
      }
      views = _.isArray(views) ? views.slice() : [views];
      _ref = this.views;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        view = _ref[_i];
        this.destroy(view, options);
      }
      if (views.length !== 0) {
        for (_j = 0, _len1 = views.length; _j < _len1; _j++) {
          view = views[_j];
          this.add(view, options);
        }
        if (!options.silent) {
          this.trigger('reset', view, this);
        }
      }
      return this;
    };

    ViewCollection.prototype.renderOne = function(model) {
      var view;
      view = new this.view(model);
      this.$el.append(view.render().el);
      this.add(view);
      return this;
    };

    ViewCollection.prototype.renderAll = function() {
      this.collection.each(this.renderOne);
      return this;
    };

    return ViewCollection;

  })(View);

  methods = ['forEach', 'each', 'map', 'reduce', 'reduceRight', 'find', 'detect', 'filter', 'select', 'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke', 'max', 'min', 'sortBy', 'sortedIndex', 'toArray', 'size', 'first', 'initial', 'rest', 'last', 'without', 'indexOf', 'shuffle', 'lastIndexOf', 'isEmpty', 'groupBy'];

  _.each(methods, function(method) {
    return ViewCollection.prototype[method] = function() {
      return _[method].apply(_, [this.views].concat(_.toArray(arguments)));
    };
  });

  module.exports = ViewCollection;
  
}});

window.require.define({"routers/app_router": function(exports, require, module) {
  var AppRouter,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = AppRouter = (function(_super) {

    __extends(AppRouter, _super);

    function AppRouter() {
      return AppRouter.__super__.constructor.apply(this, arguments);
    }

    AppRouter.prototype.routes = {
      '': function() {}
    };

    return AppRouter;

  })(Backbone.Router);
  
}});

window.require.define({"views/activities_view": function(exports, require, module) {
  var ActivitiesView, View,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  View = require('../lib/view');

  module.exports = ActivitiesView = (function(_super) {

    __extends(ActivitiesView, _super);

    function ActivitiesView() {
      return ActivitiesView.__super__.constructor.apply(this, arguments);
    }

    ActivitiesView.prototype.id = 'activities-view';

    ActivitiesView.prototype.template = function() {
      return require('./templates/activities');
    };

    return ActivitiesView;

  })(View);
  
}});

window.require.define({"views/app_view": function(exports, require, module) {
  var ActivitiesView, AppRouter, AppView, LoginView, RegisterNameView, RegisterPasswordView, View, request,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  View = require('../lib/view');

  AppRouter = require('../routers/app_router');

  ActivitiesView = require('./activities_view');

  LoginView = require('./login_view');

  RegisterNameView = require('./register_name_view');

  RegisterPasswordView = require('./register_password_view');

  request = require('lib/request');

  module.exports = AppView = (function(_super) {

    __extends(AppView, _super);

    function AppView() {
      return AppView.__super__.constructor.apply(this, arguments);
    }

    AppView.prototype.el = 'body.application';

    AppView.prototype.template = function() {
      return require('./templates/home');
    };

    AppView.prototype.initialize = function() {
      this.router = Newebe.routers.appRouter = new AppRouter();
      this.activitiesView = new ActivitiesView();
      this.loginView = new LoginView();
      this.registerNameView = new RegisterNameView();
      return this.registerPasswordView = new RegisterPasswordView();
    };

    AppView.prototype.checkUserState = function() {
      var _this = this;
      return request.get('user/state/', function(err, data) {
        if (err) {
          return alert("Something went wrong, can't load newebe data.");
        } else {
          return _this.start(data);
        }
      });
    };

    AppView.prototype.start = function(userState) {
      this.home = this.$('#home');
      if (userState.authenticated) {
        return this.displayActivities();
      } else if (userState.password) {
        return this.displayLogin();
      } else if (userState.registered) {
        return this.displayRegisterPassword();
      } else {
        return this.displayRegisterName();
      }
    };

    AppView.prototype.displayActivities = function() {
      return this.home.html(this.activitiesView.$el);
    };

    AppView.prototype.displayLogin = function() {
      this.home.html(this.loginView.$el);
      return this.loginView.focusField();
    };

    AppView.prototype.displayRegisterPassword = function() {
      this.home.html(this.registerPasswordView.$el);
      return this.registerPasswordView.focusField();
    };

    AppView.prototype.displayRegisterName = function() {
      this.home.html(this.registerNameView.$el);
      return this.registerNameView.focusField();
    };

    return AppView;

  })(View);
  
}});

window.require.define({"views/login_view": function(exports, require, module) {
  var LoginView, QuestionView, request,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  QuestionView = require('./question_view');

  request = require('../lib/request');

  module.exports = LoginView = (function(_super) {

    __extends(LoginView, _super);

    function LoginView() {
      return LoginView.__super__.constructor.apply(this, arguments);
    }

    LoginView.prototype.id = 'login-view';

    LoginView.prototype.initialize = function() {
      this.question = "What is your sesame ?";
      this.fieldId = "login-password";
      this.type = "password";
      return this.render();
    };

    LoginView.prototype.onSubmit = function() {
      var password, req;
      password = this.field.val();
      if (password.length > 0) {
        return req = request.post('login/json/', {
          password: password
        }, function(err, data) {
          return Newebe.views.appView.displayActivities();
        });
      }
    };

    return LoginView;

  })(QuestionView);
  
}});

window.require.define({"views/question_view": function(exports, require, module) {
  var QuestionView, View,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  View = require('../lib/view');

  module.exports = QuestionView = (function(_super) {

    __extends(QuestionView, _super);

    function QuestionView() {
      return QuestionView.__super__.constructor.apply(this, arguments);
    }

    QuestionView.prototype.getRenderData = function() {
      return {
        question: this.question,
        type: this.type,
        fieldId: this.fieldId
      };
    };

    QuestionView.prototype.template = function() {
      return require('./templates/question');
    };

    QuestionView.prototype.focusField = function() {
      return this.field.focus();
    };

    QuestionView.prototype.afterRender = function() {
      var _this = this;
      this.field = this.$("#" + this.fieldId);
      return this.field.keyup(function(event) {
        if (event.which === 13) {
          return _this.onSubmit();
        }
      });
    };

    QuestionView.prototype.onSubmit = function() {};

    return QuestionView;

  })(View);
  
}});

window.require.define({"views/register_name_view": function(exports, require, module) {
  var QuestionView, RegisterNameView, request,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  QuestionView = require('./question_view');

  request = require('../lib/request');

  module.exports = RegisterNameView = (function(_super) {

    __extends(RegisterNameView, _super);

    function RegisterNameView() {
      return RegisterNameView.__super__.constructor.apply(this, arguments);
    }

    RegisterNameView.prototype.id = 'register-name-view';

    RegisterNameView.prototype.initialize = function() {
      this.question = "What is your name ?";
      this.fieldId = "register-name";
      this.type = "text";
      return this.render();
    };

    RegisterNameView.prototype.onSubmit = function() {
      var name;
      name = this.field.val();
      if (name.length > 0) {
        return request.post('register/', {
          name: name
        }, function(err, data) {
          return Newebe.views.appView.displayRegisterPassword();
        });
      }
    };

    return RegisterNameView;

  })(QuestionView);
  
}});

window.require.define({"views/register_password_view": function(exports, require, module) {
  var QuestionView, RegisterPasswordView, request,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  QuestionView = require('./question_view');

  request = require('../lib/request');

  module.exports = RegisterPasswordView = (function(_super) {

    __extends(RegisterPasswordView, _super);

    function RegisterPasswordView() {
      return RegisterPasswordView.__super__.constructor.apply(this, arguments);
    }

    RegisterPasswordView.prototype.id = 'register-password-view';

    RegisterPasswordView.prototype.initialize = function() {
      this.question = "Tell me your sesame";
      this.fieldId = "register-password";
      this.type = "password";
      return this.render();
    };

    RegisterPasswordView.prototype.onSubmit = function() {
      var data, password;
      password = this.field.val();
      if (password.length > 0) {
        data = {
          password: password
        };
        return request.post('register/password/', data, function(err, data) {
          return Newebe.views.appView.displayActivities();
        });
      }
    };

    return RegisterPasswordView;

  })(QuestionView);
  
}});

window.require.define({"views/templates/activities": function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<h1>activities</h1><div id="activity-list"></div>');
  }
  return buf.join("");
  };
}});

window.require.define({"views/templates/home": function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<div id="home"><p>loading...</p></div>');
  }
  return buf.join("");
  };
}});

window.require.define({"views/templates/question": function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<div class="middle"><p class="question">' + escape((interp = question) == null ? '' : interp) + '</p><input');
  buf.push(attrs({ 'id':("" + (fieldId) + ""), 'type':("" + (type) + "") }, {"id":true,"type":true}));
  buf.push('/></div>');
  }
  return buf.join("");
  };
}});
