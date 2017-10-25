!function(){
	window.lcg = window.lcg || {};

	//组件表
	var modules = {};

	//调试模式
	lcg.debug = true;

	//整体提示
	lcg.log = function(str){
		if(lcg.debug == true)
			console.log("LCG.JS:"+str);
	}

	//绑定组件
	lcg.bind = function(key,init){
		if(modules[key] != null)
			lcg.log("覆盖了原有的'"+key+"'组件!");
		modules[key] = init;
	}

	//给现有组件添加插件
	lcg.bind.plugin = function(key,func){
		if(modules[key] == null)
			return;
		if(modules[key].plugins == null)
			modules[key].plugins = [];
		modules[key].plugins.push(func);
	}

	//创建组件
	lcg.create = function(key){
		//判断组件是否存在
		if(modules[key] == null)
		{
			lcg.log("'"+key+"'组件不存在!");
			return;
		}
		//截取参数表
		var vals = [];
		for(var i = 1;i < arguments.length;i++)
			vals.push(arguments[i]);
		//构建
		return new Builder(key,vals);
	}

	//附着组件
	lcg.use = function(proxy,key){
		//截取参数表
		var vals = [];
		for(var i = 2;i < arguments.length;i++)
			vals.push(arguments[i]);
		lcg.create.option(key,{proxy:proxy},vals);
	}

	//带参数创建
	lcg.create.option = function(key,option,vals){
		//判断组件是否存在
		if(modules[key] == null)
		{
			lcg.log("'"+key+"'组件不存在!");
			return;
		}
		//构建
		return new Builder(key,vals,option);
	}

	//组件是否存在
	lcg.hasModule = function(key){
		if(modules[key] == null)
			return false;
		return true;
	}




	//=======构建器======
	var Builder = function(key,vals,option){
		//记录配置
		var option = this._option = option || {};
		var proxy = option.proxy || this._proxy;
		//加入getModule方法
		if(proxy == null || proxy.lModule == null)
		{
			this.getModule = function(key){
				return this.getModule.modules[key];
			}.bind(this);
			this.getModule.modules = {};
		}
		else
			this.getModule = proxy.lModule;
		//加入到组件表中
		this.getModule.modules[key] = this;

		//附着指定对象
		if(proxy)
			this.proxy(proxy);
		//执行构造
		modules[key].apply(this,vals);
		//循环执行插件
		if(modules[key].plugins)
			for(var i in modules[key].plugins)
				modules[key].plugins[i].apply(this,vals);

		//如无代理则以自身为代理
		if(this._proxy == null)
			this.proxy(this);

		//返回代理对象
		return this._proxy;
	}

	//构建器核心
	Builder.prototype = {
		//代理
		proxy:function(proxy){
			if(this._proxy == null)
			{
				this._proxy = proxy;
				//加入lModule方法
				this._proxy.lModule = this.getModule;
				//强制继承
				if(this._option.extends)
					for(var i in this._option.extends)
						this.extend(this._option.extends[i]);
			}
			return this._proxy;
		},
		//继承
		extend:function(key){
			//如果没有组件
			if(modules[key] == null){
				lcg.log("没有'"+key+"'组件，无法继承!");
				return;
			}
			//截取参数表
			var vals = [];
			for(var i = 1;i < arguments.length;i++)
				vals.push(arguments[i]);
			modules[key].apply(this,vals);
			//循环执行插件
            if(modules[key].plugins)
                for(var i in modules[key].plugins)
                    modules[key].plugins[i].apply(this,vals);
		},
		//绑定消息
		message:function(key,value){
			//判断是否有代理
			if(this._proxy == null)
			{
				lcg.log("没有代理对象，自动使用空对象!");
				this._proxy = {};
			}
			//参数类型判断
			var vals = {};
			if(typeof key != "string")
				vals = key;
			else
				vals[key] = value;
			//循环加入内容
			for(var i in vals)
				addMessage(this._proxy,i,vals[i]);
		},
		//发送消息
		sendMessage:function(name){
			//截取参数表
			var vals = [];
			for(var i = 1;i < arguments.length;i++)
				vals.push(arguments[i]);
			if(this._proxy[name] == null)
				return;
			this._proxy[name].apply(this._proxy,vals);
		}
	};


	//创建消息处理函数
	var addMessage = function(target,key,value){
		//消息处理主体
		var message = function(){
			for(var i in message._messages)
				message._messages[i].apply(target,arguments);
		}

		//判断是否已经生成过处理方法
		if(target[key] == null || target[key]._messages == null){
			target[key] = message;
			message._messages = [];
		}

		//插入消息内容
		target[key]._messages.push(value);
	}
}();//======钩子模块======
//用于数据变化帧听
!function(){
    var hook = {};
    lcg.hook = hook;

    //复制数组
    lcg.copyArray = function(arr,end,start){
        var end = end || 9999999;
        var start = start || 0;
        var re = [];
        for(var i = start;i < arr.length && i<end;i++)
            re.push(arr[i]);
        return re;
    }

    //绑定数组
    hook.bindArray = function(arr,cbp,cbd){
        var push = arr.push;
        var splice = arr.splice;

        //重写push
        arr.push = function(){
            //执行原来的方法
            push.apply(arr,arguments);
            cbp(arguments);
        }

        //重写 splice
        arr.splice = function(start,del,add){
            //执行原来的方法
            splice.apply(arr,arguments);
            //如果删除了
            if(del > 0)
                cbd(start,del);
            //如果插入了
            if(arguments.length > 2)
            {
                var adds = lcg.copyArray(arguments,null,2);
                cbp(adds,start);
            }
        }
        return {push:push,splice:splice};
    }


    //绑定对象的key
    hook.bindKeySet = function(dom,key,set,data){
        var myvals = dom[key];
        var getter = function(){
            return myvals;
        };
        var setter = function(val){
            myvals = val;
            if(set)
                set(val,key,data);
        }

        //添加getter、setter
        if (Object.defineProperty){
            Object.defineProperty(dom, key, {get: getter,set: setter});
        }else{
            Object.prototype.__defineGetter__.call(dom, key, getter);
            Object.prototype.__defineSetter__.call(dom, key, setter);
        }
    }
}();!function(){
	//======事件系统======
	//事件表
	var events = {
		"bind":[]
	};

	//帧听事件
	lcg.on = function(name,cb){
		if(events[name] == null)
			events[name] = [];
		events[name].push(cb);

		//初始化
		if(name == "ready" && isReady == true)
			cb();
	}

	//触发事件
	var trigger = function(name,vals){
		if(events[name] == null)
			events[name] = [];
		var isEnd = false;
		vals = vals || {};
		vals.stop = function(){
			isEnd = true;
		}
		vals.type = name;
		//循环触发回调
		var es = events[name];
		for(var i in events[name])
		{
			//去除空回调
			if(!es[i])
				es.splice(i,1);
			//触发回调
			var re = es[i](vals);
			if(isEnd)
				return re;
		}
	}
	lcg.trigger = trigger;

	//文档载入完毕事件
	var ready = function(fn){
        if(document.addEventListener){//兼容非IE  
            document.addEventListener("DOMContentLoaded",function(){  
                //注销事件，避免反复触发  
                document.removeEventListener("DOMContentLoaded",arguments.callee,false);  
                fn();//调用参数函数  
            },false);  
        }else if(document.attachEvent){//兼容IE
            document.attachEvent("onreadystatechange",function(){  
                if(document.readyState==="complete"){  
                    document.detachEvent("onreadystatechange",arguments.callee);  
                    fn();  
                }  
            }); 
        }
        //if(document.readyState == "complete" || document.readyState == "interactive")
        //	fn();
    }

    var isReady = false;

    //帧听文档事件触发ready
    lcg._ready = function(){
    	if(isReady)
    		return;
    	//触发插件准备事件
    	trigger("plugin-ready");
    	//触发准备完毕事件
    	trigger("ready");
    	isReady = true;
    }
    ready(lcg._ready);

    //全局时钟间隔
    lcg.delayTime = 20;

    //全局时钟
    var step = function(){
    	setTimeout(step,lcg.delayTime);
    	trigger("dt");
    }
    step();

    //Dom节点事件
    lcg.domEvent = function(dom,name,cb){
    	if(typeof name == "string")
    		name = [name];
    	for(var i in name){
	    	if(dom.addEventListener)
	    		dom.addEventListener(name[i],cb,false);
	    	else
	    		dom.attachEvent("on"+name[i],cb);
    	}
    }
}();//======DOM组件系统======
!function(){
    //Dom组件核心
    var dm = {};
    lcg.domModule = dm;
    lcg.dm = dm;

    //绑定组件
    //Dom组件
    lcg.bind("dom-module",function(){
        this.initLists = function(){
            //初始化数组侦听
            initLists(this._proxy,this);
        }

        this.initIDS = function(){
            //初始化编号获取
            initIDS(this._proxy,this);
        }

        this.initModuleRoot = function(){
            //初始化子节点的ModuleRoot
            initModuleRoot(this._proxy,this);
        }

        this.initDomVal = function(){
            //记录绑定内容的哈希表
            var hash = {};
            //初始化数据绑定
            initDomVal(this._proxy,null,hash);
            //设置内容对象
            this.setDomJSON = function(vals){
                for(var i in vals)
                    if(hash[i] == true)
                        this._proxy[i] = vals[i];
            }.bind(this);
            //获取内容对象
            this.getDomJSON = function(){
                var re = {};
                for(var i in hash)
                    re[i] = this._proxy[i];
                return re;
            }.bind(this);
        }

        this.initFab = function(){
            //初始化预制
            initFab(this._proxy);
        }

        //初始化所有功能
        this.initAll = function(){
            this.initLists();
            this.initIDS();
            this.initModuleRoot();
            this.initDomVal();
            this.initFab();
        }
    });


    //组件表
    var prefabs = {};

    //预制关键字属性
    var keyssFab = {
        "type":true,
        "values":true,
        "dom-prefab":true
    };

    //添加一个组件表
    lcg.dm.add = function(key,dom){
        prefabs[key] = dom.outerHTML;
        //直接初始化
        if(dom.getAttribute("init") != null){
            var fab = document.createElement("div");
            fab.setAttribute("dom-prefab",key);
            if(dom.getAttribute("values") != null)
                fab.setAttribute("values",dom.getAttribute("values"));
            dom.parentNode.insertBefore(fab,dom);
        }
        //删除原本的节点
        if(dom.parentNode)
            dom.parentNode.removeChild(dom);
        if(fab != null)
            initFab(fab);
    }

    //初始化预制
    var initFab = function(dom){
        //创建相应的预制
        var fabs = dom.querySelectorAll("dom-prefab,*[dom-prefab]");
        if(dom && dom.getAttribute && dom.getAttribute("dom-prefab") != null)
            fabs = [dom];
        for(var i = 0;i < fabs.length;i++)
        {
            try{
                //从属性中获取预制
                var vals = {};
                if(fabs[i].getAttribute("values"))
                {
                    try{
                        vals = eval("("+fabs[i].getAttribute("values")+")");
                    }catch(e){
                        vals = fabs[i].getAttribute("values");
                    }
                }
                var type = fabs[i].getAttribute("dom-prefab") || fabs[i].getAttribute("type");
                //初始化组件
                dm.init(type,fabs[i],vals);
            }catch(e){
                lcg.log(type+"初始化异常");
                console.log(e);
            }
        }
    }


    //转移属性
    var moveAttribute = function(from,to){
        //从属性获取初值
        for(var j = 0;j < from.attributes.length;j++)
        {
            var atts = from.attributes[j];
            if(keyssFab[atts.name] != true)
                to.setAttribute(atts.name,atts.value);
        }
    }

    dm.create = function(name,vals,option){
        return dm.init(name,null,vals,option);
    }


    //创建初始化一个组件
    dm.init = function(name,dom,vals,option){
        option = option || {};
        //判断是否已经定义了组件结构
        if(prefabs[name] == null)
        {
            lcg.log("没有定义'"+name+"'组件的结构，无法创建相关的预制!");
            return;
        }
        //创建Dom结构
        if(dom == null)
            dom = document.createElement("div");
        dom.innerHTML = prefabs[name];
        var domz = dom.querySelector("*");
        moveAttribute(dom,domz);
        //删除原本的DOM
        if(dom.parentNode)
        {
            dom.parentNode.insertBefore(domz,dom);
            dom.parentNode.removeChild(dom);
        }
        dom = domz;

        //附着组件
        var values = [vals];
        if(option.vals)
            for(var i in option.vals)
                values.push(option.vals[i]);
        var re = lcg.create.option(name,{proxy:dom,extends:["dom-module"]},values);

        //触发初始化事件
        lcg.trigger("dom-module-init",{name:name,dom:dom,vals:vals});
        return re;
    }

    //直接通过字符串绑定组件
    dm.bind = function(name,domText,func){
        prefabs[name] = domText;
        return lcg.bind(name,func);
    }

    //初始化ID表
    var initIDS = function(dom,module){
        var ids = {};
        var idoms = dom.querySelectorAll("*[lid]");
        for(var i = 0;i < idoms.length;i++)
        {
            var attr = idoms[i].getAttribute("lid");
            if(ids[attr] == null)
                ids[attr] = idoms[i];
        }
        module.ids = ids;
    }


    //======组件列表======
    //初始化所有组件列表
    var initLists = function(dom,module){
        var lists = dom.querySelectorAll("*[dom-list]");
        for(var i = 0;i < lists.length;i++)
            initList(lists[i],module);
        if(dom.getAttribute && dom.getAttribute("dom-list") != null)
            initList(dom,module);
    }

    //初始化组件列表
    var initList = function(dom,root){
        var vals = dom.getAttribute("dom-list");
        var kv = vals.split(":");
        var domList = [];
        //获取数组
        var arr = root[kv[0]];
        if(arr == null)
            return;
        arr.fabList = domList;
        arr.module = root;
        //删除方法
        arr.del = function(module){
            for(var i in domList)
            {
                if(domList[i] == module)
                    arr.splice(Number(i),1);
                if(domList[i] == module._proxy)
                    arr.splice(Number(i),1);
            }
        }
        //指定module
        arr.bind = function(key){
            kv[1] = key;
            return arr;
        }
        //从数组替换
        arr.copy = function(arrt){
            arr.splice(0,arr.length);
            for(var i = 0;i < arrt.length;i++)
                arr.push(arrt[i]);
        }
        //生成一个fab
        var create = function(datas){
            //创建并阻止初始化
            var fab = dm.init(kv[1],null,datas,{vals:[arr,root]});
            return fab;
        }
        //初始化数组原有内容
        for(var i = 0;i < arr.length;i++){
            var fab = create(arr[i]);
            dom.appendChild(fab);
            domList.push(fab);
        }
        //绑定数组方法
        lcg.hook.bindArray(arr,
            //插入数据
            function(datas,start){
                //加入非插入
                if(start == null || start == 0)
                    for(var i in datas){
                        //初始化组件
                        var fab = create(datas[i]);
                        dom.appendChild(fab);
                        domList.push(fab);
                    }
                else
                {
                    //插入
                    var startDom = domList[start];
                    for(var i in datas){
                        //初始化组件
                        var fab = create(datas[i]);
                        //插入相应内容
                        dom.insertBefore(fab,startDom);
                        domList.splice(start+i,0,fab);
                    }
                }
            },
            //删除数据
            function(start,len){
                for(var i = 0;i < len;i++)
                    dom.removeChild(domList[start + i]);
                domList.splice(start,len);
            });
    }



    //======moduleRoot传递======
    var initModuleRoot = function(dom,module){
        var dlist = dom.querySelectorAll("*");
        for(var i = 0;i < dlist.length;i++)
            if(dlist[i].$root == null)
                dlist[i].moduleRoot = dlist[i].$root = module;
    }



    //======对象绑定======
    var initDomVal = function(dom,root,hash){
        root = root || dom;
        //如果是注解
        if(dom.nodeName == "#comment")
            return;
        //如果是shadowDom
        if(dom.nodeName == "#document-fragment")
        {
            //判断子节点
            for(var i = 0;i < dom.childNodes.length;i++)
                initDomVal(dom.childNodes[i],root,hash)
            return;
        }
        //如果是文本
        if(dom.nodeName == "#text"){
            var re = dom.data.match(/{{(.*?)}}/);
            if(re && re.length > 0)
            {
                hash[re[1]] = true;
                listenerText(dom,root);
            }
            return;
        }
        //判断是否需要绑定
        var re = dom.outerHTML.match(/{{.*?}}/);
        if(re && re.length > 0)
        {
            //判断子节点
            for(var i = 0;i < dom.childNodes.length;i++)
                initDomVal(dom.childNodes[i],root,hash)
        }
        //判断属性是否绑定
        for(var i = 0;i < dom.attributes.length;i++){
            var atts = dom.attributes[i];
            var re = atts.value.match(/{{(.*?)}}/);
            if(re && re.length > 0)
            {
                hash[re[1]] = true;
                listenerAttr(atts,root);
            }
        }
    }

    //侦听文本变化
    var listenerText = function(dom,root){
        var jxList = dom.data.match(/{{.*?}}|[\s\S]/g);
        for(var i in jxList)
            if(jxList[i].length > 3)
                listenerOnce(jxList[i],root,function(val,i){
                    jxList[i] = val;
                    dom.data = jxList.join("");
                },i);
    }

    //侦听属性变化
    var listenerAttr = function(atts,root){
        var jxList = atts.value.match(/{{.*?}}|[\s\S]/g);
        for(var i in jxList)
            if(jxList[i].length > 3)
                listenerOnce(jxList[i],root,function(val,i){
                    jxList[i] = val;
                    atts.value = jxList.join("");
                },i);
    }

    //侦听一次变化
    var listenerOnce = function(str,root,cb,data){
        root.__bindKeyList = root.__bindKeyList || {};
        var key = str.match(/{{(.*?)}}/)[1];
        //初始化绑定列表
        if(root.__bindKeyList[key] == null)
            root.__bindKeyList[key] = [];
        var list = root.__bindKeyList[key];
        //加入回调
        cb._data = data;
        list.push(cb);
        cb(root[key],data);
        //如果没有绑定过
        if(!list._isbind)
        {
            list._isbind = true;
            //绑定变化
            lcg.hook.bindKeySet(root,key,function(val){
                for(var i=0;i < list.length;i++)
                    list[i](val,list[i]._data);
            });
        }
    }

    //文档载入事件，放在最后防止立即触发
    lcg.on("ready",function(){
        //保存组件相应的HTML
        var doms = document.querySelectorAll("*[dom-module]");
        for(var i = 0;i < doms.length;i++){
            var dom = doms[i];
            var key = dom.getAttribute("dom-module");
            dom.removeAttribute("dom-module");
            lcg.dm.add(key,dom);
        }
        //初始化所有预制
        initFab(document);
    });
    
}();



//======预载入HTML======
!function(){
    //插件载入事件
    lcg.on("plugin-ready",function(){
        var loaders = document.querySelectorAll("loader,*[dom-loader]");
        for(var i = 0;i < loaders.length;i++)
        {
            var src = loaders[i].getAttribute("src") || loaders[i].getAttribute("dom-loader");
            loadOne(loaders[i],src);
        }
    });


    //属性字符串转属性
    var str2Attr = function(dom,str){
        var kvs = str.match(/[a-zA-Z0-9\-]*=".*?"/g);
        if(kvs == null)
            return;
        for(var i = 0;i < kvs.length;i++)
        {
            var kv = kvs[i].match(/([a-zA-Z0-9\-]*)="(.*?)"/);
            dom.setAttribute(kv[1],kv[2]);
        }
    }



    var setStyleText = function(style,str){
        style.loadingStr = str;
        try{
            var textNode = document.createTextNode(str);
            style.appendChild(textNode);
        }catch(e){
            if(style.styleSheet)
                style.styleSheet.cssText = str;
            else
            {
                var set = function(){
                    try{
                        style.styleSheet.cssText = str;
                    }catch(e){
                        
                    }
                }
                setTimeout(set);
            }
        }
    }


    //载入一个节点
    var loadOne = function(dom,src){
        lcg.ajax.get(src,function(res){
            var scripts = res.match(/<script.*?>[\s\S]*?<\/script>/g);
            var styles = res.match(/<style.*?>[\s\S]*?<\/style>/g);
            res = res.replace(/<script.*?>[\s\S]*?<\/script>|<style.*?>[\s\S]*?<\/style>/g,"");
            dom.innerHTML = res;
            for(var i = dom.childNodes.length - 1;i >= 0;i--)
                dom.parentNode.insertBefore(dom.childNodes[i],dom);
            //执行脚本
            if(scripts)
                for(var i = 0;i < scripts.length;i++)
                    eval(scripts[i].match(/<script.*?>([\s\S]*?)<\/script>/)[1]);
            //加入样式
            if(styles)
                for(var i = 0;i < styles.length;i++)
                {
                    var style = document.createElement("style");
                    setStyleText(style,styles[i].match(/<style.*?>([\s\S]*?)<\/style>/)[1]);
                    str2Attr(style,styles[i].match(/<style(.*?)>[\s\S]*?<\/style>/)[1]);
                    dom.parentNode.insertBefore(style,dom);
                }
            //删除载入的标记节点
            dom.parentNode.removeChild(dom);
        },false);
    }
}();/*Ajax扩展*/
!function(){


	//默认参数
	var initOptions = {
		//地址
		url:"",
		//方法类型
		method:"GET",
		//是否异步
		async:true,
		//用户名
		user:"",
		//密码
		password:"",
		//头部表
		headers:null,
		//成功返回
		onSuccess:null,
		//返回失败
		onError:null,
		//参数
		vars:null
	};


	//ajax核心方法
	var ajax = function(option)
	{
		//参数设置
		for(var i in initOptions)
			if(option[i] == null)
				option[i] = initOptions[i];

		//ajax定义
		var xmlhttp;
		if (window.XMLHttpRequest)
		{
			//高版本浏览器
			xmlhttp=new XMLHttpRequest();
		}
		else
		{
			//低版本IE
			xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
		}

		//状态变化时事件
		xmlhttp.onreadystatechange=function()
		{
			//执行结束
			if(xmlhttp.readyState==4){
				//返回成功
				if(xmlhttp.status==200){
					if(option.onSuccess)
						option.onSuccess(xmlhttp);
				}
				else
				{
					//返回失败
					if(option.onError)
						option.onError(xmlhttp);
				}
			}
		}

		//设置头部
		if(option.headers)
			for(var i in option.headers)
				xmlhttp.setRequestHeader(i,option.headers[i]);

		//参数生成
		var vars = [];
		var sendVar = null;
		if(option.vars)
			for(var i in option.vars)
				vars.push(encodeURI(i)+"="+encodeURI(option.vars[i]));

		//POST传值
		if(option.method == "POST")
			sendVar = vars.join("&");

		//GET传值
		if(option.method == "GET")
		{
			if(/\?/.test(option.url))
				option.url += "&" + vars.join("&");
			else
				option.url += "?" + vars.join("&");
		}

		//打开方法
		xmlhttp.open("GET",option.url,option.async);
		//发送
		xmlhttp.send(sendVar);
	}



	//发送GET数据
	ajax.get = function(url,vars,cb,async){
		//参数缺省
		if(typeof vars == "function")
		{
			async = cb;
			cb = vars;
		}

		//使用参数
		var option = {
			url:url,
			vars:vars,
			method:"GET",
			onSuccess:function(res){
				if(cb)
					cb(res.responseText,false,res);
			},
			onError:function(res){
				if(cb)
					cb("",true,res);
			},
			async:async
		}

		ajax(option);
	}

	//发送POST数据
	ajax.post = function(url,vars,cb,async){
		//参数缺省
		if(typeof vars == "function")
		{
			async = cb;
			cb = vars;
		}

		//使用参数
		var option = {
			url:url,
			vars:vars,
			method:"POST",
			onSuccess:function(res){
				if(cb)
					cb(res.responseText,false,res);
			},
			onError:function(res){
				if(cb)
					cb("",true,res);
			},
			async:async
		}

		ajax(option);
	}

	lcg.ajax = ajax;
}();//======Dom构造器======
//可以把形如a[a:www,b:ddd]{b[aaa:aaa,bbb:bbb]:aaaa}构造成dom结构
!function(){
	//构造Dom核心函数
	lcg.buildDom = function(str){
		return arr2Dom(str2Arr(str));
	}

	//特殊词
	var tag = {
		"[":true,
		"]":true,
		",":true,
		":":true,
		"{":true,
		"}":true,
		";":true
	};

	//JSON生成Dom
	var arr2Dom = function(dom,root){
		//生成标签
		var d = document.createElement(dom.tag);
		if(root == null)
		{
			root = d;
			d.ids = {};
		}
		//设置属性
		if(dom.attr)
			for(var i in dom.attr)
			{
				d.setAttribute(i,dom.attr[i]);
				if(i == "lid")
					root.ids[dom.attr[i]] = d;
			}
		//设置text
		if(dom.text)
			d.innerText = dom.text;
		//加入子节点
		if(dom.childs)
			for(var i in dom.childs)
				d.appendChild(arr2Dom(dom.childs[i],root));
		return d;
	}

	//字符串分析为数组
	var str2Arr = function(str){
		var dom = {};
		var now = "";
		var state = 0;
		var level = 0;
		var list = [];
		//根据关键字设置状态
		var setState = function(key){
			if(key == "[")
				state = 1;
			if(key == "{")
				state = 2;
			if(key == ":")
				state = 3;
		}
		//循环分析
		for(var i = 0;i < str.length;i++)
		{
			//获取标签名
			if(state == 0)
			{
				if(tag[str[i]])
				{
					if(dom.tag == null)
						dom.tag = now;
					now = "";
					setState(str[i]);
					continue;
				}
				now += str[i];
			}
			//获取属性
			else if(state == 1)
			{
				if(str[i] == "]")
				{
					dom.attr = str2Attr(now);
					state = 0;
					continue;
				}
				now += str[i];
			}
			//解析子项
			else if(state == 2)
			{
				if(str[i] == "{")
					level--;
				if(str[i] == "}")
				{
					level++;
					if(level >= 1)
					{
						if(now != "")
							list.push(now);
						dom.childs = [];
						for(var i in list)
							dom.childs.push(str2Arr(list[i]));
						break;
					}
				}
				if(str[i] == ";" && level == 0)
				{
					list.push(now);
					now = "";
					continue;
				}
				now += str[i];
			}
			//解析innerText
			else if(state == 3){
				dom.text = str.substr(i);
				break;
			}
		}
		if(dom.tag == null)
			dom.tag = now;
		return dom;
	}

	//解析出属性
	var str2Attr = function(str){
		var re = {};
		var list = str.split(",");
		for(var i in list){
			var kv = list[i].split(":");
			re[kv[0]] = kv[1];
		}
		return re;
	}
}();