
//测试逻辑
//es       电梯列表
//floor    楼层列表
var MainTest = function(es,floors){

	//计算时间间隔
	var dt = ((floors.length-1)*5)*500/es.length;

	//绑定一个电梯
	var bindOne = function(i){
		setTimeout(function(){
			es[i].on("idel",function(){
				//初始化
				if(this.isDown == null)
					this.getDown = false;
				//判断上下状态
				if(!this.isDown){
					if(this.getFloor() >= floors.length){
						this.isDown = true;
						this.getDown = true;
						this.getUp = false;
						this.moveTo(this.getFloor()-1);
					}
					else
						this.moveTo(this.getFloor()+1);
				}else{
					if(this.getFloor() <= 1){
						this.isDown = false;
						this.getDown = false;
						this.getUp = true;
						this.moveTo(this.getFloor()+1);
					}
					else
						this.moveTo(this.getFloor()-1);
				}
			});
		},i*dt);
	}

	//循环
	for(var i in es)
		bindOne(i);
};


var MainTest = function(es,floors){
	//es        电梯组列表
	//floors    楼层组列表
	
	//绑定第一个电梯空闲事件
	es[0].on("idel",function(){
		//在一二楼之间反复移动
		if(this.getFloor() == 1)
			this.moveTo(2);
		else
			this.moveTo(1);
	});

	//尽情的发挥你的逻辑吧
};