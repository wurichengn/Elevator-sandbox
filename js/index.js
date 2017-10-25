!function(){

	//模拟核心
	var mains;

	//游戏参数
	var gameData = {
		//楼层数
		floor:2,
		//电梯数
		e:1,
		//电梯承载的人数
		Emax:4,
		//客户出现间隔
		cd:60
	};

	//电梯组
	lcg.bind("floors",function(){
		//初始化Dom
		this.initAll();
		var self = mains = this;

		//初始化楼层
		this.floors = [];
		this.initFloor = function(data){
			this.floors = [];
			this.ids["floors"].innerHTML = "";
			for(var i = data.num;i > 0;i--){
				var floor = lcg.dm.create("floor",{id:i,par:this});
				this.floors.splice(0,0,floor.lModule.modules["floor"]);
				this.ids["floors"].appendChild(floor);
			}
		}

		this.initFloor({num:2});

		//初始化电梯
		this.es = [];
		this.initE = function(data){
			this.es = [];
			this.ids["es"].innerHTML = "";
			for(var i = data.num;i > 0;i--){
				var e = lcg.dm.create("e",{id:i,par:this});
				this.es.push(e.lModule.modules["e"]);
				this.ids["es"].appendChild(e);
			}
		}

		this.initE({num:1});

		//创建客户间隔
		var addCD = 60;
		var addCDN = addCD;
		//全局时钟
		var timer = function(){
			//执行事件
			setTimeout(timer,1000/60);
			for(var i in self.es)
				self.es[i].dt();
			//动态添加客户
			addCDN--;
			while(addCDN < 0){
				addCDN += addCD;
				addPeople();
			}
		}
		setTimeout(timer,20);

		//调用主测试
		MainTest(this.es,this.floors);

		//测试用scriptDom
		var sDom;

		//执行测试
		this.startTest = function(){
			var text = coder.get();
			try{
				//构建函数
				var func = eval("("+text+")");
				if(typeof func != "function")
					return alert("请编写一个函数!");
				//初始化内容
				this.initFloor({num:gameData.floor});
				this.initE({num:gameData.e});
				addCD = gameData.cd;
				addCDN = 0;
				//执行函数
				func(this.es,this.floors);
			}catch(e){
				//错误处理
				alert("出现语法错误，请在控制台查看");
				eval("("+text+")");
				//console.log(e);
			}
		}

		//动态添加客人
		var addPeople = function(){
			var id = Math.floor(Math.random()*self.floors.length);
			self.floors[id].addPeople();
		}

	});

	//楼层
	lcg.bind("floor",function(datas){
		//初始化Dom
		this.initAll();
		var self = this;

		//设置楼层名
		this.setDomJSON(datas);

		//设置楼层等待人数
		this.setNum = function(n){
			this.ids["peoples"].innerHTML = "";
			for(var i = 0;i < n;i++){
				var img = document.createElement("i");
				img.className = "if icon-man";
				this.ids["peoples"].appendChild(img);
			}
		}

		this.setNum(0);

		//在楼层等待的客户列表
		var peoples = [];

		//渲染显示效果
		var render = function(){
			//设置数量指示
			self.setNum(peoples.length);

			//设置上下欲望指示
			self.ids["up"].style["color"] = "#999";
			self.ids["down"].style["color"] = "#999";
			for(var i in peoples){
				if(peoples[i].mit > datas.id)
					self.ids["up"].style["color"] = "#4c8bf5";
				if(peoples[i].mit < datas.id)
					self.ids["down"].style["color"] = "#4c8bf5";
			}
		}

		//让用户进入电梯
		this.putPeople = function(e,num){
			if(num >= gameData.Emax)
				return;
			for(var i = peoples.length-1;i >= 0;i--){
				if((peoples[i].mit > datas.id && e.getUp) || (peoples[i].mit < datas.id && e.getDown)){
					e.put(peoples[i]);
					peoples.splice(i,1);
					render();
					num++;
					if(num >= gameData.Emax)
						return;
				}
			}
		}

		//随机添加一个用户
		this.addPeople = function(){
			if(peoples.length >= 10)
				return;
			var id = Math.floor(Math.random()*(datas.par.floors.length-1));
			if(id >= (datas.id - 1))
				id++;
			id++;
			peoples.push({mit:id,st:new Date().getTime()});
			render();
		}

	});

	//电梯
	lcg.bind("e",function(datas){
		//初始化Dom
		this.initAll();
		var self = this;

		//确定位置
		this._proxy.style["left"] = (datas.id-1)*70+"px";
		this._proxy.num = 0;

		//当前的楼层
		var floor = 1;
		this.getFloor = function(){
			return floor;
		}
		//缓动动画相关
		var start=1,end=1,time=0,now=0;

		//是否接收向上或者向下的人
		this.getUp = true;
		this.getDown = true;

		//电梯的事件处理
		var Events = {};
		this.on = function(key,cb){
			if(Events[key] == null)
				Events[key] = [];
			Events[key].push(cb);
		}

		//触发事件
		var trigger = function(key,data){
			for(var i in Events[key])
				Events[key][i].call(self,data);
		}

		//移动到制定楼层
		this.moveTo = function(num){
			if(num < 1)
				num = 1;
			if(num > datas.par.floors.length)
				num = datas.par.floors.length;
			start = floor;
			end = num;
			time = (Math.abs(end - start) + 1.5)*30;
			now = 0;
		}

		//是否是空闲状态
		var idel = false;

		this.getIdel = function(){
			return idel;
		}

		//空闲处理工作
		var idels = function(){
			floor = end;
			idel = true;
			//触发idel
			trigger("idel");
			//执行下人
			for(var i = peoples.length-1;i >= 0;i--)
				if(peoples[i].mit == floor)
					peoples.splice(i,1);
			//执行上人
			if(datas.par.floors[Number(floor)-1])
				datas.par.floors[Number(floor)-1].putPeople(self,peoples.length);
			//设置数量
			setNum(peoples.length);
			//设置期望位置
			var list = [];
			for(var i in peoples)
				list.push(peoples[i].mit);
			setWill(list);
		}

		//设置客人数量
		var setNum = function(num){
			self._proxy.num = num;
		}

		//设置期望
		var setWill = function(list){
			self.ids["gl"].innerHTML = "";
			for(var i in list)
			{
				var a = document.createElement("a");
				a.style["transform"] = "translateY("+(-(list[i]-1)*60)+"px)";
				self.ids["gl"].appendChild(a);
			}
		}

		//客人列表
		var peoples = [];

		this.put = function(people){
			peoples.push(people);
		}

		//帧事件
		this.dt = function(){
			idel = false;
			if(start == end){
				idels();
				return;
			}
			now++;
			if(now > time){
				now = time;
				idels();
			}
			this.ids["box"].style["transform"] = "translateY("+(-(ease(now,start,end-start,time)-1)*60)+"px)";
		}
	});

	//缓动函数
	var ease = function(t,b,c,d){
　　	if((t/=d/2)<1)
　　		return c/2*Math.pow(t,3)+b;
　　	return c/2*(Math.pow(t-2,3)+2)+b;
　　};


	//代码编辑器
	lcg.bind("coder",function(){
		this.initAll();
		var self = window.coder = this;

		//定义编辑器变量
		var coder;

		//延迟创建
		setTimeout(function(){
			//创建代码编辑器
			coder = CodeMirror(self.ids["code"],
				{value:MainTest.toString()});
			coder.setOption("theme","panda-syntax");
		});

		this.run = function(){
			mains.startTest();
		}

		//启动
		this.get = function(){
			return coder.getValue();
		}
	});


	//设置面板
	lcg.bind("setter",function(){
		this.initAll();

		window.setter = this;

		this.ok = function(){
			this._proxy.style["display"] = "none";
			//设置参数
			gameData.floor = this.ids["floor"].value;
			gameData.e = this.ids["e"].value;
			gameData.Emax = this.ids["Emax"].value;
			gameData.cd = 3/(Number(this.ids["cd"].value)+2)*60;
			mains.startTest();
		}

		this.show = function(){
			this._proxy.style["display"] = "";
		}
	});

}();