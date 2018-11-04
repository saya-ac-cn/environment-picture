package ac.cn.saya.spyder.tools;

import java.io.PrintWriter;
import java.io.StringWriter;
/**
 * @Title: Log4jUtils
 * @ProjectName DataCenter
 * @Description: TODO
 * @Author Saya
 * @Date: 2018/9/29 23:05
 * @Description:
 */

public class Log4jUtils {

    /**
     * log4j日志记录
     * @param t
     * @return
     */
    public static String getTrace(Throwable t) {
        StringWriter stringWriter= new StringWriter();
        PrintWriter writer= new PrintWriter(stringWriter);
        t.printStackTrace(writer);
        StringBuffer buffer= stringWriter.getBuffer();
        return buffer.toString();
    }

}
