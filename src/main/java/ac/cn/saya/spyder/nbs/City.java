package ac.cn.saya.spyder.nbs;

import ac.cn.saya.spyder.tools.Log4jUtils;
import org.apache.log4j.Logger;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * @Title: City
 * @ProjectName spyder
 * @Description: TODO
 * @Author Saya
 * @Date: 2018/11/3 15:09
 * @Description:
 */
@Component
public class City {

    private static Logger logger = Logger.getLogger(City.class);

    private static Map<Integer, String> cssMap = new HashMap<Integer, String>();
    private static BufferedWriter bufferedWriter = null;

    static {
        cssMap.put(1, "provincetr");// 省
        cssMap.put(2, "citytr");// 市
        cssMap.put(3, "countytr");// 县
        cssMap.put(4, "towntr");// 镇
        cssMap.put(5, "villagetr");// 村
    }

    /**
     * 程序执行主方法
     *
     * @throws IOException
     */
    public static void main() throws IOException {
        int level = 1;
        initFile();
        // 获取全国各个省级信息
        Document connect = connect("http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/2017/");
        Elements rowProvince = connect.select("tr." + cssMap.get(level));
        // 遍历每一行的省份城市
        for (Element provinceElement : rowProvince) {
            Elements select = provinceElement.select("a");
            for (Element province : select) {
                // 获取该省的a标签 ：<a href="63.html">青海省<br></a>
                parseNextLevel(province, level + 1);
            }
        }
        closeStream();
    }

    /**
     * 打开文件流 @Title: initFile @Description: TODO(这里用一句话描述这个方法的作用) @param @return
     * void @throws
     */
    private static void initFile() {
        try {
            bufferedWriter = new BufferedWriter(
                    new FileWriter(new File(System.getProperty("user.dir") + File.separator + "src" + File.separator
                            + "main" + File.separator + "resources" + File.separator + "cityInfo.txt"), true));
        } catch (IOException e) {
            logger.error("打开文件流失败:" + Log4jUtils.getTrace(e));
        }
    }

    /**
     * 关闭文件流 @Title: closeStream @Description:
     * TODO(这里用一句话描述这个方法的作用) @param @return void @throws
     */
    private static void closeStream() {
        if (bufferedWriter != null) {
            try {
                bufferedWriter.close();
            } catch (IOException e) {
                logger.error("关闭文件流失败:" + Log4jUtils.getTrace(e));
            }
            bufferedWriter = null;
        }
    }

    /**
     *
     * @Title: parseNextLevel @Description: TODO(这里用一句话描述这个方法的作用) @param
     *         parentElement:<a href="63.html">青海省<br>
     *         </a> @return void @throws
     */
    private static void parseNextLevel(Element parentElement, int level) throws IOException {
        try {
            Thread.sleep(2000);// 睡眠一下，否则可能出现各种错误状态码
        } catch (InterruptedException e) {
            logger.error("线程休眠失败：" + Log4jUtils.getTrace(e));
        }

        Document doc = null;
        try {
            doc = connect(parentElement.attr("abs:href"));
        } catch (Exception e) {
            logger.error("打开网页失败：" + Log4jUtils.getTrace(e));
        }
        if (doc != null) {
            Elements newsHeadlines = doc.select("tr." + cssMap.get(level));//
            // 获取表格的一行数据
            for (Element element : newsHeadlines) {
                printInfo(element, level + 1);
                Elements select = element.select("a");// 在递归调用的时候，这里是判断是否是村一级的数据，村一级的数据没有a标签
                if (select.size() != 0) {
                    parseNextLevel(select.last(), level + 1);
                }
            }
        }
    }

    /**
     * 写一行数据到数据文件中去
     *
     * @param element
     *            爬取到的数据元素
     * @param level
     *            城市级别
     */
    private static void printInfo(Element element, int level) {
        try {
            // bufferedWriter.write(element.select("td").last().text() + "{" +
            // level + "}["+ element.select("td").first().text() + "]");
            bufferedWriter.write(
                    element.select("td").first().text() + "-" + level + "-" + element.select("td").last().text());
            bufferedWriter.newLine();
            bufferedWriter.flush();
        } catch (IOException e) {
            logger.error("写入到文件失败：" + Log4jUtils.getTrace(e));
        }
    }

    private static Document connect(String url) {
        if (url == null || url.isEmpty()) {
            logger.error("The input url('" + url + "') is invalid!");
            throw new IllegalArgumentException("The input url('" + url + "') is invalid!");
        }
        try {
            return Jsoup.connect(url).timeout(100 * 1000).get();
        } catch (IOException e) {
            logger.error("在连接中发生了异常：" + Log4jUtils.getTrace(e));
            return null;
        }
    }

}
