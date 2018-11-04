package ac.cn.saya.spyder;

import ac.cn.saya.spyder.nbs.City;
import ac.cn.saya.spyder.tools.Log4jUtils;
import org.apache.log4j.Logger;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;

import java.io.IOException;

@SpringBootApplication
public class SpyderApplication {

	private static Logger logger = Logger.getLogger(SpyderApplication.class);

	public static void main(String[] args) {
		// SpringApplication.run(SpyderApplication.class, args);
		SpringApplication springApplication = new SpringApplication(SpyderApplication.class);
		springApplication.setAddCommandLineProperties(false);// 禁止命令行设置参数
		ApplicationContext context = springApplication.run(args);
		logger.warn("爬虫脚本正在启动 ... ");//项目启动完成打印项目名
		City run = context.getBean(City.class);
		try {
			run.main();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			logger.error("在爬取中执行异常：" + Log4jUtils.getTrace(e));
		}
		logger.warn("数据爬取完毕... ");// 项目启动完成打印项目名
	}
}
