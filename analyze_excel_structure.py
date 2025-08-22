#!/usr/bin/env python3
"""
Excel文件结构分析器
分析入住汇总.xls文件结构并生成详细文档

作者: 系统自动生成
日期: 2025-01-21
"""

import os
import sys
import json
from datetime import datetime
from typing import Dict, List, Any, Optional
import xlrd
import pandas as pd


class ExcelStructureAnalyzer:
    """Excel文件结构分析器"""
    
    def __init__(self, file_path: str, output_dir: str = "docs"):
        self.file_path = file_path
        self.output_dir = output_dir
        self.analysis_results = {}
        self.create_output_dir()
    
    def create_output_dir(self) -> None:
        """创建输出目录"""
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
            print(f"✅ 创建输出目录: {self.output_dir}")
    
    def analyze_file_info(self) -> Dict[str, Any]:
        """分析文件基本信息"""
        if not os.path.exists(self.file_path):
            raise FileNotFoundError(f"文件不存在: {self.file_path}")
        
        file_stats = os.stat(self.file_path)
        
        return {
            "文件名": os.path.basename(self.file_path),
            "文件路径": os.path.abspath(self.file_path),
            "文件大小": f"{file_stats.st_size} bytes ({file_stats.st_size / 1024:.2f} KB)",
            "创建时间": datetime.fromtimestamp(file_stats.st_ctime).strftime('%Y-%m-%d %H:%M:%S'),
            "修改时间": datetime.fromtimestamp(file_stats.st_mtime).strftime('%Y-%m-%d %H:%M:%S'),
            "文件类型": "Microsoft Excel 97-2003 工作簿 (.xls)"
        }
    
    def analyze_workbook_structure(self) -> Dict[str, Any]:
        """分析工作簿结构"""
        try:
            # 使用xlrd读取.xls文件
            workbook = xlrd.open_workbook(self.file_path)
            
            structure = {
                "工作表数量": workbook.nsheets,
                "工作表列表": workbook.sheet_names(),
                "日期模式": workbook.datemode,
                "编码信息": getattr(workbook, 'encoding', 'Unknown'),
                "工作表详情": []
            }
            
            # 分析每个工作表
            for sheet_name in workbook.sheet_names():
                sheet = workbook.sheet_by_name(sheet_name)
                sheet_info = self.analyze_sheet_structure(sheet, sheet_name)
                structure["工作表详情"].append(sheet_info)
            
            return structure
            
        except Exception as e:
            print(f"❌ xlrd分析失败: {e}")
            try:
                # 尝试使用pandas读取
                return self.analyze_with_pandas()
            except Exception as e2:
                print(f"❌ pandas分析也失败: {e2}")
                return {"错误": f"无法读取文件: {e}, {e2}"}
    
    def analyze_with_pandas(self) -> Dict[str, Any]:
        """使用pandas分析Excel文件"""
        try:
            # 读取所有工作表
            excel_file = pd.ExcelFile(self.file_path)
            
            structure = {
                "工作表数量": len(excel_file.sheet_names),
                "工作表列表": excel_file.sheet_names,
                "引擎": excel_file.engine,
                "工作表详情": []
            }
            
            for sheet_name in excel_file.sheet_names:
                df = pd.read_excel(self.file_path, sheet_name=sheet_name)
                sheet_info = self.analyze_dataframe_structure(df, sheet_name)
                structure["工作表详情"].append(sheet_info)
            
            return structure
            
        except Exception as e:
            return {"错误": f"pandas读取失败: {e}"}
    
    def analyze_sheet_structure(self, sheet, sheet_name: str) -> Dict[str, Any]:
        """分析单个工作表结构（xlrd方式）"""
        try:
            sheet_info = {
                "工作表名称": sheet_name,
                "行数": sheet.nrows,
                "列数": sheet.ncols,
                "数据范围": f"A1:{self.get_excel_column_name(sheet.ncols)}{sheet.nrows}",
                "列信息": [],
                "数据类型统计": {},
                "示例数据": []
            }
            
            # 分析列信息
            if sheet.nrows > 0:
                header_row = []
                for col in range(sheet.ncols):
                    try:
                        cell_value = sheet.cell_value(0, col)
                        header_row.append(str(cell_value))
                    except:
                        header_row.append(f"列{col + 1}")
                
                sheet_info["列标题"] = header_row
                
                # 分析每列数据类型
                for col in range(min(sheet.ncols, 20)):  # 限制分析前20列
                    col_info = self.analyze_column_xlrd(sheet, col, header_row[col] if col < len(header_row) else f"列{col + 1}")
                    sheet_info["列信息"].append(col_info)
                
                # 获取示例数据（前5行）
                for row in range(min(sheet.nrows, 5)):
                    row_data = []
                    for col in range(sheet.ncols):
                        try:
                            cell_value = sheet.cell_value(row, col)
                            row_data.append(str(cell_value))
                        except:
                            row_data.append("")
                    sheet_info["示例数据"].append(row_data)
            
            return sheet_info
            
        except Exception as e:
            return {"工作表名称": sheet_name, "错误": f"分析失败: {e}"}
    
    def analyze_dataframe_structure(self, df: pd.DataFrame, sheet_name: str) -> Dict[str, Any]:
        """分析DataFrame结构（pandas方式）"""
        try:
            sheet_info = {
                "工作表名称": sheet_name,
                "行数": len(df),
                "列数": len(df.columns),
                "数据范围": f"A1:{self.get_excel_column_name(len(df.columns))}{len(df)}",
                "列标题": df.columns.tolist(),
                "列信息": [],
                "数据类型统计": {},
                "示例数据": []
            }
            
            # 分析每列信息
            for col in df.columns:
                col_info = self.analyze_column_pandas(df[col], col)
                sheet_info["列信息"].append(col_info)
            
            # 数据类型统计
            sheet_info["数据类型统计"] = df.dtypes.value_counts().to_dict()
            
            # 示例数据（前5行）
            sheet_info["示例数据"] = df.head().values.tolist()
            
            return sheet_info
            
        except Exception as e:
            return {"工作表名称": sheet_name, "错误": f"分析失败: {e}"}
    
    def analyze_column_xlrd(self, sheet, col_idx: int, col_name: str) -> Dict[str, Any]:
        """分析单列数据（xlrd方式）"""
        try:
            col_info = {
                "列名": col_name,
                "列索引": col_idx + 1,
                "Excel列名": self.get_excel_column_name(col_idx + 1),
                "数据类型": {},
                "非空值数量": 0,
                "空值数量": 0,
                "唯一值数量": 0,
                "示例值": []
            }
            
            values = []
            unique_values = set()
            type_counts = {"文本": 0, "数字": 0, "日期": 0, "空值": 0, "其他": 0}
            
            # 分析数据
            for row in range(sheet.nrows):
                try:
                    cell = sheet.cell(row, col_idx)
                    cell_value = cell.value
                    
                    if cell_value == "" or cell_value is None:
                        type_counts["空值"] += 1
                        col_info["空值数量"] += 1
                    else:
                        col_info["非空值数量"] += 1
                        values.append(cell_value)
                        unique_values.add(str(cell_value))
                        
                        # 判断数据类型
                        if cell.ctype == xlrd.XL_CELL_TEXT:
                            type_counts["文本"] += 1
                        elif cell.ctype == xlrd.XL_CELL_NUMBER:
                            type_counts["数字"] += 1
                        elif cell.ctype == xlrd.XL_CELL_DATE:
                            type_counts["日期"] += 1
                        else:
                            type_counts["其他"] += 1
                            
                except:
                    type_counts["其他"] += 1
            
            col_info["数据类型"] = type_counts
            col_info["唯一值数量"] = len(unique_values)
            col_info["示例值"] = list(set(str(v) for v in values[:10]))
            
            return col_info
            
        except Exception as e:
            return {"列名": col_name, "错误": f"分析失败: {e}"}
    
    def analyze_column_pandas(self, series: pd.Series, col_name: str) -> Dict[str, Any]:
        """分析单列数据（pandas方式）"""
        try:
            col_info = {
                "列名": col_name,
                "数据类型": str(series.dtype),
                "非空值数量": int(series.count()),
                "空值数量": int(series.isnull().sum()),
                "唯一值数量": int(series.nunique()),
                "示例值": []
            }
            
            # 获取示例值
            unique_values = series.dropna().unique()
            col_info["示例值"] = [str(v) for v in unique_values[:10]]
            
            # 如果是数值类型，添加统计信息
            if pd.api.types.is_numeric_dtype(series):
                col_info["统计信息"] = {
                    "最小值": float(series.min()) if not series.empty else None,
                    "最大值": float(series.max()) if not series.empty else None,
                    "平均值": float(series.mean()) if not series.empty else None,
                    "标准差": float(series.std()) if not series.empty else None
                }
            
            return col_info
            
        except Exception as e:
            return {"列名": col_name, "错误": f"分析失败: {e}"}
    
    def get_excel_column_name(self, col_num: int) -> str:
        """将数字转换为Excel列名（A, B, C, ...）"""
        column_name = ""
        while col_num > 0:
            col_num -= 1
            column_name = chr(col_num % 26 + ord('A')) + column_name
            col_num //= 26
        return column_name
    
    def generate_analysis_report(self) -> None:
        """生成完整分析报告"""
        print("🔍 开始分析Excel文件结构...")
        
        # 文件基本信息
        print("📊 分析文件基本信息...")
        self.analysis_results["文件信息"] = self.analyze_file_info()
        
        # 工作簿结构
        print("📋 分析工作簿结构...")
        self.analysis_results["工作簿结构"] = self.analyze_workbook_structure()
        
        # 生成时间戳
        self.analysis_results["分析信息"] = {
            "分析时间": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "分析器版本": "1.0.0",
            "Python版本": sys.version
        }
        
        print("✅ 分析完成")
    
    def save_json_report(self) -> None:
        """保存JSON格式报告"""
        json_path = os.path.join(self.output_dir, "excel_structure_analysis.json")
        
        try:
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(self.analysis_results, f, ensure_ascii=False, indent=2)
            print(f"✅ JSON报告已保存: {json_path}")
        except Exception as e:
            print(f"❌ 保存JSON报告失败: {e}")
    
    def save_markdown_report(self) -> None:
        """保存Markdown格式报告"""
        md_path = os.path.join(self.output_dir, "excel_structure_analysis.md")
        
        try:
            with open(md_path, 'w', encoding='utf-8') as f:
                f.write(self.generate_markdown_content())
            print(f"✅ Markdown报告已保存: {md_path}")
        except Exception as e:
            print(f"❌ 保存Markdown报告失败: {e}")
    
    def generate_markdown_content(self) -> str:
        """生成Markdown格式内容"""
        md_content = []
        
        # 标题
        md_content.append("# Excel文件结构分析报告")
        md_content.append("")
        md_content.append(f"**分析时间**: {self.analysis_results.get('分析信息', {}).get('分析时间', 'Unknown')}")
        md_content.append("")
        
        # 文件信息
        file_info = self.analysis_results.get("文件信息", {})
        md_content.append("## 📋 文件基本信息")
        md_content.append("")
        for key, value in file_info.items():
            md_content.append(f"- **{key}**: {value}")
        md_content.append("")
        
        # 工作簿结构
        wb_structure = self.analysis_results.get("工作簿结构", {})
        md_content.append("## 📊 工作簿结构概览")
        md_content.append("")
        
        if "错误" in wb_structure:
            md_content.append(f"❌ **分析错误**: {wb_structure['错误']}")
        else:
            md_content.append(f"- **工作表数量**: {wb_structure.get('工作表数量', 0)}")
            md_content.append(f"- **工作表列表**: {', '.join(wb_structure.get('工作表列表', []))}")
            md_content.append("")
            
            # 详细工作表信息
            sheets_detail = wb_structure.get("工作表详情", [])
            for i, sheet in enumerate(sheets_detail, 1):
                md_content.append(f"### 工作表 {i}: {sheet.get('工作表名称', 'Unknown')}")
                md_content.append("")
                
                if "错误" in sheet:
                    md_content.append(f"❌ **分析错误**: {sheet['错误']}")
                else:
                    # 基本信息
                    md_content.append("#### 📏 基本信息")
                    md_content.append("")
                    md_content.append(f"- **行数**: {sheet.get('行数', 0)}")
                    md_content.append(f"- **列数**: {sheet.get('列数', 0)}")
                    md_content.append(f"- **数据范围**: {sheet.get('数据范围', 'Unknown')}")
                    md_content.append("")
                    
                    # 列信息
                    md_content.append("#### 📋 列信息")
                    md_content.append("")
                    
                    col_headers = sheet.get('列标题', [])
                    if col_headers:
                        md_content.append("**列标题**:")
                        md_content.append("")
                        for j, header in enumerate(col_headers, 1):
                            md_content.append(f"{j}. {header}")
                        md_content.append("")
                    
                    # 列详情表格
                    col_info = sheet.get('列信息', [])
                    if col_info:
                        md_content.append("**列详情**:")
                        md_content.append("")
                        md_content.append("| 列名 | 数据类型 | 非空值 | 空值 | 唯一值 | 示例值 |")
                        md_content.append("|------|----------|--------|------|--------|--------|")
                        
                        for col in col_info:
                            if "错误" not in col:
                                col_name = col.get('列名', 'Unknown')
                                data_type = str(col.get('数据类型', 'Unknown'))
                                non_null = col.get('非空值数量', 0)
                                null_count = col.get('空值数量', 0)
                                unique_count = col.get('唯一值数量', 0)
                                examples = ', '.join(col.get('示例值', [])[:3])
                                
                                md_content.append(f"| {col_name} | {data_type} | {non_null} | {null_count} | {unique_count} | {examples} |")
                        md_content.append("")
                    
                    # 示例数据
                    sample_data = sheet.get('示例数据', [])
                    if sample_data:
                        md_content.append("#### 📄 示例数据（前5行）")
                        md_content.append("")
                        md_content.append("```")
                        for row_idx, row in enumerate(sample_data[:5]):
                            md_content.append(f"行{row_idx + 1}: {row}")
                        md_content.append("```")
                        md_content.append("")
                
                md_content.append("---")
                md_content.append("")
        
        # 分析信息
        analysis_info = self.analysis_results.get("分析信息", {})
        md_content.append("## ℹ️ 分析信息")
        md_content.append("")
        for key, value in analysis_info.items():
            md_content.append(f"- **{key}**: {value}")
        
        return "\n".join(md_content)
    
    def run(self) -> None:
        """运行完整分析流程"""
        try:
            print("🚀 启动Excel结构分析器")
            print(f"📂 目标文件: {self.file_path}")
            print(f"📁 输出目录: {self.output_dir}")
            print("-" * 50)
            
            # 生成分析报告
            self.generate_analysis_report()
            
            # 保存报告
            print("💾 保存分析报告...")
            self.save_json_report()
            self.save_markdown_report()
            
            print("-" * 50)
            print("🎉 分析完成！")
            print(f"📊 JSON报告: {os.path.join(self.output_dir, 'excel_structure_analysis.json')}")
            print(f"📝 Markdown报告: {os.path.join(self.output_dir, 'excel_structure_analysis.md')}")
            
        except Exception as e:
            print(f"❌ 分析过程中发生错误: {e}")
            import traceback
            traceback.print_exc()


def main():
    """主函数"""
    # 文件路径
    excel_file = "入住汇总.xls"
    docs_dir = "docs"
    
    # 检查文件是否存在
    if not os.path.exists(excel_file):
        print(f"❌ 错误: 文件不存在 - {excel_file}")
        print(f"🔍 当前目录: {os.getcwd()}")
        print("📂 当前目录文件:")
        for f in os.listdir('.'):
            if f.endswith(('.xls', '.xlsx')):
                print(f"  - {f}")
        return
    
    # 创建分析器并运行
    analyzer = ExcelStructureAnalyzer(excel_file, docs_dir)
    analyzer.run()


if __name__ == "__main__":
    main()